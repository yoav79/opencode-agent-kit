#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.join(HERE, 'fixtures', 'valid');
const VALIDATOR_SOURCE = path.join(HERE, 'validate-plan.mjs');
const TIMESTAMP_SOURCE = path.join(HERE, 'update-timestamps.mjs');
const GRAPH_SOURCE = path.join(HERE, 'build-epic-graph.mjs');

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function withFixture(mutate) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'task-planner-v35-'));
  await cp(FIXTURE_ROOT, root, { recursive: true });
  await cp(VALIDATOR_SOURCE, path.join(root, 'task-planning', 'tools', 'validate-plan.mjs'));
  await cp(TIMESTAMP_SOURCE, path.join(root, 'task-planning', 'tools', 'update-timestamps.mjs'));
  await cp(GRAPH_SOURCE, path.join(root, 'task-planning', 'tools', 'build-epic-graph.mjs'));
  try {
    if (mutate) await mutate(root);
    const run = spawnSync('node', ['task-planning/tools/validate-plan.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });
    const readiness = await json(path.join(root, 'task-planning', 'readiness.json'));
    return { ...run, readiness };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function codes(result) {
  return new Set(result.readiness.blockingIssues.map((issue) => issue.code));
}

test('acepta una cadena semántica v3.5 consistente y agrupada', async () => {
  const result = await withFixture();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.readiness.status, 'passed');
  assert.equal(result.readiness.validator.version, '3.5');
});

test('rechaza tarea sin bloque semántico', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(root, 'task-planning', 'tasks', 'TASK-003.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace(/\n## Contrato semántico[\s\S]*$/, '\n'), 'utf8');
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('TASK_SECTION_MISSING'));
  assert(codes(result).has('TASK_SEMANTIC_BLOCK_MISSING'));
});

test('rechaza backend binding de otro behavior en la tarea', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(root, 'task-planning', 'tasks', 'TASK-003.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replaceAll('mailctl domain create', 'mailctl domain delete'), 'utf8');
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('TASK_SEMANTIC_BLOCK_MISMATCH'));
  assert(codes(result).has('TASK_FOREIGN_BACKEND_BINDING'));
});

test('rechaza outcome de capacidad distinto al contrato', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(root, 'task-planning', 'capability-map.json');
    const data = await json(file);
    data.capabilities.find((item) => item.id === 'CAP-DOM-CREATE').result = 'El dominio fue eliminado.';
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('CAPABILITY_OUTCOME_MISMATCH'));
});

test('rechaza sourceFunctionId inexistente aunque se repita en los JSON', async () => {
  const result = await withFixture(async (root) => {
    for (const name of ['semantic-contract.json', 'requirements.json']) {
      const file = path.join(root, 'task-planning', name);
      const data = await json(file);
      const records = name === 'semantic-contract.json'
        ? data.contracts
        : data.requirements.flatMap((requirement) => requirement.behaviors);
      records.find((item) => item.id === 'BEH-DOM-CREATE' || item.behaviorId === 'BEH-DOM-CREATE').sourceFunctionId = 'FUN-FAKE-CREATE';
      await writeJson(file, data);
    }
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('SOURCE_FUNCTION_NOT_IN_BLUEPRINT'));
});

test('rechaza semanticKey arbitrario aunque todos los JSON coincidan', async () => {
  const result = await withFixture(async (root) => {
    const replacements = [
      ['semantic-contract.json', (data) => { data.contracts[0].semanticKey = 'arbitrary.wrong'; }],
      ['requirements.json', (data) => { data.requirements[0].behaviors[0].semanticKey = 'arbitrary.wrong'; }],
      ['capability-map.json', (data) => { data.capabilities.find((item) => item.id === 'CAP-DOM-CREATE').semanticKeys = ['arbitrary.wrong']; }],
      ['task-plan.json', (data) => { data.tasks.find((item) => item.id === 'TASK-003').semanticKeys = ['arbitrary.wrong']; }],
    ];
    for (const [name, mutate] of replacements) {
      const file = path.join(root, 'task-planning', name);
      const data = await json(file);
      mutate(data);
      await writeJson(file, data);
    }
    const taskFile = path.join(root, 'task-planning', 'tasks', 'TASK-003.md');
    await writeFile(taskFile, (await readFile(taskFile, 'utf8')).replaceAll('dom.create', 'arbitrary.wrong'), 'utf8');
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('SEMANTIC_KEY_NOT_DERIVED_FROM_SOURCE_FUNCTION'));
});

test('rechaza operation alterada frente al blueprint', async () => {
  const result = await withFixture(async (root) => {
    const semanticFile = path.join(root, 'task-planning', 'semantic-contract.json');
    const semantic = await json(semanticFile);
    semantic.contracts[0].operation = 'delete_domain';
    await writeJson(semanticFile, semantic);
    const requirementsFile = path.join(root, 'task-planning', 'requirements.json');
    const requirements = await json(requirementsFile);
    requirements.requirements[0].behaviors[0].operation = 'delete_domain';
    await writeJson(requirementsFile, requirements);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('SEMANTIC_BLUEPRINT_MISMATCH'));
});

test('rechaza el campo executionMode heredado de 3.3', async () => {
  const result = await withFixture(async (root) => {
    const stateFile = path.join(root, 'task-planning', 'project-state.json');
    const state = await json(stateFile);
    state.project.executionMode = 'semantic_pilot';
    await writeJson(stateFile, state);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('EXECUTION_MODE_DEPRECATED'));
});

test('acepta aprobación, publicación y cierre por el ciclo normal', async () => {
  const result = await withFixture(async (root) => {
    const stateFile = path.join(root, 'task-planning', 'project-state.json');
    const state = await json(stateFile);
    state.approvals.finalPlan = {
      status: 'approved',
      requestedAt: '2026-07-23T06:40:00.000Z',
      resolvedAt: '2026-07-23T06:41:00.000Z',
      resolvedBy: 'user',
      comment: 'Aprobación final explícita.',
    };
    state.progress.planPublished = true;
    state.progress.finalPlanApproved = true;
    state.workflow.status = 'completed';
    state.workflow.pendingUserAction = null;
    state.artifacts.epicPlan.status = 'published';
    state.artifacts.taskPlan.status = 'published';
    await writeJson(stateFile, state);

    for (const name of ['epic-plan.json', 'task-plan.json']) {
      const file = path.join(root, 'task-planning', name);
      const data = await json(file);
      data.status = 'published';
      await writeJson(file, data);
    }

    const touch = spawnSync('node', [
      'task-planning/tools/update-timestamps.mjs',
      'touch',
      'task-planning/epic-plan.json',
      'task-planning/task-plan.json',
      'task-planning/project-state.json',
    ], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test', TASK_PLANNER_TEST_NOW: '2026-07-23T07:00:00.000Z' },
    });
    assert.equal(touch.status, 0, touch.stderr);

    const complete = spawnSync('node', [
      'task-planning/tools/update-timestamps.mjs',
      'complete',
    ], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test', TASK_PLANNER_TEST_NOW: '2026-07-23T07:01:00.000Z' },
    });
    assert.equal(complete.status, 0, complete.stderr);
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.readiness.status, 'passed');
});

test('rechaza estado de artefacto distinto al documento', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(root, 'task-planning', 'project-state.json');
    const data = await json(file);
    data.artifacts.semanticContract.status = 'validated';
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('ARTIFACT_STATUS_MISMATCH'));
});


test('fixture válido agrupa un requisito y cinco behaviors en una épica', async () => {
  const result = await withFixture();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.readiness.summary.epics, 1);
  assert.equal(result.readiness.warnings.length, 0);
});

test('rechaza fragmentar un requisito sin splitReason', async () => {
  const result = await withFixture(async (root) => {
    const epicFile = path.join(root, 'task-planning', 'epic-plan.json');
    const epicPlan = await json(epicFile);
    const original = epicPlan.epics[0];
    const secondBehavior = original.behaviorIds.pop();
    const secondCapability = original.capabilityIds.find((id) => id === 'CAP-DOM-VALIDATE');
    original.capabilityIds = original.capabilityIds.filter((id) => id !== secondCapability);
    original.taskIds = original.taskIds.filter((id) => id !== 'TASK-007');
    epicPlan.epics.push({
      id: 'EPIC-DOM-002',
      title: 'Validación de dominios separada',
      file: 'task-planning/epics/EPIC-DOM-002.md',
      incrementId: 'INC-DOM-002',
      dependencyIds: ['EPIC-DOM-001'],
      capabilityIds: [secondCapability],
      behaviorIds: [secondBehavior],
      requirementIds: ['REQ-DOM-001'],
      decisionIds: [],
      splitReason: null,
      taskIds: ['TASK-007'],
      decomposed: true,
    });
    await writeJson(epicFile, epicPlan);

    const capFile = path.join(root, 'task-planning', 'capability-map.json');
    const caps = await json(capFile);
    caps.capabilities.find((item) => item.id === secondCapability).ownerEpicId = 'EPIC-DOM-002';
    await writeJson(capFile, caps);

    const taskFile = path.join(root, 'task-planning', 'task-plan.json');
    const tasks = await json(taskFile);
    tasks.tasks.find((item) => item.id === 'TASK-007').epicId = 'EPIC-DOM-002';
    await writeJson(taskFile, tasks);

    await writeFile(
      path.join(root, 'task-planning', 'epics', 'EPIC-DOM-002.md'),
      '# EPIC-DOM-002: Validación de dominios separada\n',
      'utf8',
    );

    const stateFile = path.join(root, 'task-planning', 'project-state.json');
    const state = await json(stateFile);
    state.progress.epicsGenerated = 2;
    state.progress.epicsDecomposed = 2;
    await writeJson(stateFile, state);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('EPIC_REQUIREMENT_FRAGMENTATION_UNJUSTIFIED'));
});

test('rechaza behavior duplicado entre épicas', async () => {
  const result = await withFixture(async (root) => {
    const epicFile = path.join(root, 'task-planning', 'epic-plan.json');
    const epicPlan = await json(epicFile);
    epicPlan.epics.push({
      id: 'EPIC-DUPLICATE',
      title: 'Duplicada',
      file: 'task-planning/epics/EPIC-DUPLICATE.md',
      incrementId: 'INC-DUP',
      dependencyIds: [],
      capabilityIds: [],
      behaviorIds: ['BEH-DOM-CREATE'],
      requirementIds: ['REQ-DOM-001'],
      decisionIds: [],
      splitReason: null,
      taskIds: [],
      decomposed: true,
    });
    await writeJson(epicFile, epicPlan);
    await writeFile(path.join(root, 'task-planning', 'epics', 'EPIC-DUPLICATE.md'), '# EPIC-DUPLICATE\n', 'utf8');
    const stateFile = path.join(root, 'task-planning', 'project-state.json');
    const state = await json(stateFile);
    state.progress.epicsGenerated = 2;
    state.progress.epicsDecomposed = 2;
    await writeJson(stateFile, state);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('BEHAVIOR_MULTIPLE_EPICS'));
});


test('acepta fragmentación respaldada por decisión y splitReason', async () => {
  const result = await withFixture(async (root) => {
    const decisionsFile = path.join(root, 'task-planning', 'decisions.json');
    const decisions = await json(decisionsFile);
    decisions.decisions.push({ id: 'DEC-EPIC-SPLIT', status: 'resolved', resolution: 'approved' });
    await writeJson(decisionsFile, decisions);

    const epicFile = path.join(root, 'task-planning', 'epic-plan.json');
    const epicPlan = await json(epicFile);
    const original = epicPlan.epics[0];
    const secondBehavior = original.behaviorIds.pop();
    const secondCapability = 'CAP-DOM-VALIDATE';
    original.capabilityIds = original.capabilityIds.filter((id) => id !== secondCapability);
    original.taskIds = original.taskIds.filter((id) => id !== 'TASK-007');
    original.decisionIds = ['DEC-EPIC-SPLIT'];
    original.splitReason = {
      type: 'independent_delivery',
      description: 'La validación se entrega como incremento independiente aprobado.',
      decisionId: 'DEC-EPIC-SPLIT',
    };
    epicPlan.epics.push({
      id: 'EPIC-DOM-002',
      title: 'Validación de dominios',
      file: 'task-planning/epics/EPIC-DOM-002.md',
      incrementId: 'INC-DOM-002',
      dependencyIds: ['EPIC-DOM-001'],
      capabilityIds: [secondCapability],
      behaviorIds: [secondBehavior],
      requirementIds: ['REQ-DOM-001'],
      decisionIds: ['DEC-EPIC-SPLIT'],
      splitReason: {
        type: 'independent_delivery',
        description: 'La validación se entrega como incremento independiente aprobado.',
        decisionId: 'DEC-EPIC-SPLIT',
      },
      taskIds: ['TASK-007'],
      decomposed: true,
    });
    await writeJson(epicFile, epicPlan);

    const capFile = path.join(root, 'task-planning', 'capability-map.json');
    const caps = await json(capFile);
    caps.capabilities.find((item) => item.id === secondCapability).ownerEpicId = 'EPIC-DOM-002';
    await writeJson(capFile, caps);

    const taskFile = path.join(root, 'task-planning', 'task-plan.json');
    const tasks = await json(taskFile);
    tasks.tasks.find((item) => item.id === 'TASK-007').epicId = 'EPIC-DOM-002';
    await writeJson(taskFile, tasks);

    await writeFile(path.join(root, 'task-planning', 'epics', 'EPIC-DOM-002.md'), '# EPIC-DOM-002: Validación de dominios\n', 'utf8');

    const stateFile = path.join(root, 'task-planning', 'project-state.json');
    const state = await json(stateFile);
    state.progress.decisionsDetected = 1;
    state.progress.decisionsResolved = 1;
    state.progress.epicsGenerated = 2;
    state.progress.epicsDecomposed = 2;
    await writeJson(stateFile, state);

    const graph = spawnSync('node', ['task-planning/tools/build-epic-graph.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test', TASK_PLANNER_TEST_NOW: '2026-07-23T07:09:00.000Z' },
    });
    assert.equal(graph.status, 0, graph.stderr);

    const retimestamp = spawnSync('node', ['task-planning/tools/update-timestamps.mjs', 'touch', 'task-planning/decisions.json', 'task-planning/epic-plan.json', 'task-planning/capability-map.json', 'task-planning/task-plan.json', 'task-planning/project-state.json'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test', TASK_PLANNER_TEST_NOW: '2026-07-23T07:10:00.000Z' },
    });
    assert.equal(retimestamp.status, 0, retimestamp.stderr);
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.readiness.summary.epics, 2);
});


test('rechaza JSON modificado sin actualizar timestamp y hash', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(root, 'task-planning', 'requirements.json');
    const data = await json(file);
    data.requirements[0].description += ' cambio sin touch';
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('ARTIFACT_TIMESTAMP_DIGEST_MISMATCH'));
});


test('fixture válido declara una execution wave sin dependencias', async () => {
  const result = await withFixture();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.readiness.summary.epicDependencies, 0);
  assert.equal(result.readiness.summary.executionWaves, 1);
  assert.equal(result.readiness.summary.parallelEpicCandidates, 0);
});

test('rechaza una dependencia de épica no derivada', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(root, 'task-planning', 'epic-plan.json');
    const data = await json(file);
    data.epics[0].dependencyIds = ['EPIC-FAKE'];
    data.epics[0].dependencyDetails = [{
      epicId: 'EPIC-FAKE',
      types: ['capability'],
      capabilityIds: [],
      taskIds: [],
      reason: 'Dependencia inventada.',
    }];
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('EPIC_DEPENDENCY_UNKNOWN'));
  assert(codes(result).has('EPIC_DEPENDENCY_GRAPH_MISMATCH'));
});

test('rechaza executionWaves obsoletas', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(root, 'task-planning', 'epic-plan.json');
    const data = await json(file);
    data.executionWaves = [{ wave: 2, epicIds: ['EPIC-DOM-001'] }];
    data.epics[0].executionWave = 2;
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(codes(result).has('EPIC_EXECUTION_WAVES_MISMATCH'));
  assert(codes(result).has('EPIC_EXECUTION_WAVE_MISMATCH'));
});

test('build-epic-graph agrupa épicas independientes en la misma wave', async () => {
  const result = await withFixture(async (root) => {
    const epicFile = path.join(root, 'task-planning', 'epic-plan.json');
    const plan = await json(epicFile);
    plan.epics.push({
      id: 'EPIC-INDEPENDENT-001',
      title: 'Módulo independiente',
      file: 'task-planning/epics/EPIC-INDEPENDENT-001.md',
      incrementId: 'INC-INDEPENDENT-001',
      dependencyIds: [],
      dependencyDetails: [],
      executionWave: 1,
      capabilityIds: [],
      behaviorIds: [],
      requirementIds: [],
      decisionIds: [],
      splitReason: null,
      taskIds: [],
      decomposed: true,
    });
    await writeJson(epicFile, plan);
    await writeFile(path.join(root, 'task-planning', 'epics', 'EPIC-INDEPENDENT-001.md'), '# EPIC-INDEPENDENT-001\n', 'utf8');

    const stateFile = path.join(root, 'task-planning', 'project-state.json');
    const state = await json(stateFile);
    state.progress.epicsGenerated = 2;
    state.progress.epicsDecomposed = 2;
    await writeJson(stateFile, state);

    const graph = spawnSync('node', ['task-planning/tools/build-epic-graph.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test', TASK_PLANNER_TEST_NOW: '2026-07-23T08:00:00.000Z' },
    });
    assert.equal(graph.status, 0, graph.stderr);
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.readiness.summary.executionWaves, 1);
  assert.equal(result.readiness.summary.parallelEpicCandidates, 2);
});
