#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { artifactDigest } from '../../shared/tools/devflow-runtime-helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHARED_HELPER = path.join(HERE, '..', '..', 'shared', 'tools', 'devflow-runtime-helpers.mjs');
const SELECT_TOOL = path.join(HERE, 'select-next-task.mjs');
const VALIDATE_TOOL = path.join(HERE, 'validate-next-task.mjs');
const SELECTION_TEMPLATE = path.join(HERE, '..', 'selection.json');
const SELECTION_SCHEMA = path.join(HERE, '..', 'task-selection.schema.json');
const EXECUTION_TEMPLATE = path.join(HERE, '..', '..', 'execution', 'execution-state.json');
const FIXTURE_ROOT = path.join(HERE, '..', '..', 'task-planner', 'tools', 'fixtures', 'valid', '.devflow', 'task-planner');

async function json(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'next-task-'));
  await mkdir(path.join(root, '.devflow', 'execution', 'tools'), { recursive: true });
  await mkdir(path.join(root, '.devflow', 'shared', 'tools'), { recursive: true });
  await mkdir(path.join(root, '.devflow', 'task-planner'), { recursive: true });

  await cp(SHARED_HELPER, path.join(root, '.devflow', 'shared', 'tools', 'devflow-runtime-helpers.mjs'));
  await cp(SELECT_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'select-next-task.mjs'));
  await cp(VALIDATE_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'validate-next-task.mjs'));
  await cp(SELECTION_SCHEMA, path.join(root, '.devflow', 'execution', 'task-selection.schema.json'));
  await cp(SELECTION_TEMPLATE, path.join(root, '.devflow', 'execution', 'selection.json'));

  await cp(path.join(FIXTURE_ROOT, 'project-state.json'), path.join(root, '.devflow', 'task-planner', 'project-state.json'));
  await cp(path.join(FIXTURE_ROOT, 'readiness.json'), path.join(root, '.devflow', 'task-planner', 'readiness.json'));
  await cp(path.join(FIXTURE_ROOT, 'epic-plan.json'), path.join(root, '.devflow', 'task-planner', 'epic-plan.json'));
  await cp(path.join(FIXTURE_ROOT, 'task-plan.json'), path.join(root, '.devflow', 'task-planner', 'task-plan.json'));
  await cp(path.join(FIXTURE_ROOT, 'capability-map.json'), path.join(root, '.devflow', 'task-planner', 'capability-map.json'));

  const projectState = await json(path.join(root, '.devflow', 'task-planner', 'project-state.json'));
  projectState.project.id = 'demo-project';
  projectState.progress.planPublished = true;
  projectState.progress.finalPlanApproved = true;
  projectState.approvals.finalPlan.status = 'approved';
  projectState.approvals.finalPlan.requestedAt = '2026-07-26T12:00:00.000Z';
  projectState.approvals.finalPlan.resolvedAt = '2026-07-26T12:05:00.000Z';
  projectState.approvals.finalPlan.resolvedBy = 'user';
  projectState.approvals.finalPlan.comment = 'Plan aprobado para ejecución';
  await writeJson(path.join(root, '.devflow', 'task-planner', 'project-state.json'), projectState);

  const epicPlan = await json(path.join(root, '.devflow', 'task-planner', 'epic-plan.json'));
  epicPlan.status = 'published';
  epicPlan.timestamps.contentHash = artifactDigest(epicPlan);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'epic-plan.json'), epicPlan);

  const taskPlan = await json(path.join(root, '.devflow', 'task-planner', 'task-plan.json'));
  taskPlan.status = 'published';
  taskPlan.timestamps.contentHash = artifactDigest(taskPlan);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'task-plan.json'), taskPlan);

  const capabilityMap = await json(path.join(root, '.devflow', 'task-planner', 'capability-map.json'));
  capabilityMap.timestamps.contentHash = artifactDigest(capabilityMap);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'capability-map.json'), capabilityMap);

  const executionState = await json(EXECUTION_TEMPLATE);
  executionState.project.id = projectState.project.id;
  executionState.project.planningVersion = projectState.project.planningVersion;
  executionState.status = 'active';
  executionState.revision = 4;
  await writeJson(path.join(root, '.devflow', 'execution', 'execution-state.json'), executionState);

  return root;
}

async function loadDocs(root) {
  return {
    projectState: await json(path.join(root, '.devflow', 'task-planner', 'project-state.json')),
    readiness: await json(path.join(root, '.devflow', 'task-planner', 'readiness.json')),
    epicPlan: await json(path.join(root, '.devflow', 'task-planner', 'epic-plan.json')),
    taskPlan: await json(path.join(root, '.devflow', 'task-planner', 'task-plan.json')),
    capabilityMap: await json(path.join(root, '.devflow', 'task-planner', 'capability-map.json')),
    executionState: await json(path.join(root, '.devflow', 'execution', 'execution-state.json')),
  };
}

async function saveDocs(root, docs) {
  docs.epicPlan.timestamps.contentHash = artifactDigest(docs.epicPlan);
  docs.taskPlan.timestamps.contentHash = artifactDigest(docs.taskPlan);
  docs.capabilityMap.timestamps.contentHash = artifactDigest(docs.capabilityMap);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'project-state.json'), docs.projectState);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'readiness.json'), docs.readiness);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'epic-plan.json'), docs.epicPlan);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'task-plan.json'), docs.taskPlan);
  await writeJson(path.join(root, '.devflow', 'task-planner', 'capability-map.json'), docs.capabilityMap);
  await writeJson(path.join(root, '.devflow', 'execution', 'execution-state.json'), docs.executionState);
}

function runSelect(root) {
  return spawnSync('node', ['.devflow/execution/tools/select-next-task.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
}

function runValidate(root, args = []) {
  return spawnSync('node', ['.devflow/execution/tools/validate-next-task.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

async function selectionFile(root) {
  return json(path.join(root, '.devflow', 'execution', 'selection.json'));
}

test('tarea única disponible: selecciona TASK-001 con instalación independiente de next-task', async () => {
  const root = await createFixture();
  try {
    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'TASK_SELECTED');

    const selection = await selectionFile(root);
    assert.equal(selection.selectedTaskId, 'TASK-001');
    assert.equal(selection.executionWave, 1);
    assert.deepEqual(selection.otherReadyTaskIds, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('dependencias completadas: al completar TASK-001 y TASK-002 elige TASK-003', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.executionState.tasks = [
      {
        taskId: 'TASK-001',
        status: 'completed',
        attemptCount: 1,
        maxAttempts: 3,
        activeRunId: null,
        reservation: null,
        blocker: null,
        lastResult: null,
        updatedAt: null,
      },
      {
        taskId: 'TASK-002',
        status: 'completed',
        attemptCount: 1,
        maxAttempts: 3,
        activeRunId: null,
        reservation: null,
        blocker: null,
        lastResult: null,
        updatedAt: null,
      },
    ];
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.selectedTaskId, 'TASK-003');
    assert.deepEqual(selection.otherReadyTaskIds, ['TASK-004', 'TASK-005', 'TASK-006', 'TASK-007']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('dependencias pendientes: no adelanta TASK-003 mientras TASK-002 siga pendiente', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.executionState.tasks = [{
      taskId: 'TASK-001',
      status: 'completed',
      attemptCount: 1,
      maxAttempts: 3,
      activeRunId: null,
      reservation: null,
      blocker: null,
      lastResult: null,
      updatedAt: null,
    }];
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.selectedTaskId, 'TASK-002');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ciclo de dependencias: devuelve STATE_CONFLICT', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.taskPlan.tasks[0].dependencyIds = ['TASK-002'];
    docs.taskPlan.tasks[1].dependencyIds = ['TASK-001'];
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'STATE_CONFLICT');
    const selection = await selectionFile(root);
    assert.equal(selection.classification, 'STATE_CONFLICT');
    assert.ok(selection.issues.some((entry) => entry.code === 'TASK_DEPENDENCY_CYCLE'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('selección determinista por wave e ID: prioriza menor wave antes que menor ID', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.executionState.tasks = [
      {
        taskId: 'TASK-001',
        status: 'completed',
        attemptCount: 1,
        maxAttempts: 3,
        activeRunId: null,
        reservation: null,
        blocker: null,
        lastResult: null,
        updatedAt: null,
      },
      {
        taskId: 'TASK-002',
        status: 'completed',
        attemptCount: 1,
        maxAttempts: 3,
        activeRunId: null,
        reservation: null,
        blocker: null,
        lastResult: null,
        updatedAt: null,
      },
    ];
    docs.epicPlan.epics.push({
      id: 'EPIC-DOM-002',
      title: 'Wave tardía',
      file: '.devflow/task-planner/epics/EPIC-DOM-002.md',
      incrementId: 'INC-DOM-002',
      dependencyIds: [],
      capabilityIds: [],
      behaviorIds: [],
      requirementIds: [],
      decisionIds: [],
      splitReason: null,
      taskIds: ['TASK-000'],
      decomposed: true,
      dependencyDetails: [],
      executionWave: 2,
    });
    docs.epicPlan.executionWaves.push({ wave: 2, epicIds: ['EPIC-DOM-002'] });
    docs.taskPlan.tasks.push({
      id: 'TASK-000',
      title: 'Menor ID pero wave mayor',
      file: '.devflow/task-planner/tasks/TASK-000.md',
      epicId: 'EPIC-DOM-002',
      type: 'enabling',
      dependencyIds: [],
      createsCapabilityIds: [],
      consumesCapabilityIds: [],
      behaviorIds: [],
      semanticKeys: [],
      requirementCoverage: [],
    });
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.selectedTaskId, 'TASK-003');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('límite de concurrencia: si ya hay un run activo devuelve NO_READY_TASK', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.executionState.policy.maxConcurrentTasks = 1;
    docs.executionState.tasks = [{
      taskId: 'TASK-001',
      status: 'running',
      attemptCount: 1,
      maxAttempts: 3,
      activeRunId: '.devflow/execution/runs/TASK-001/attempt-01',
      reservation: null,
      blocker: null,
      lastResult: null,
      updatedAt: null,
    }];
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.classification, 'NO_READY_TASK');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('selección stale: validate-next-task rechaza una selección vieja tras cambiar la revisión', async () => {
  const root = await createFixture();
  try {
    assert.equal(runSelect(root).status, 0);

    const docs = await loadDocs(root);
    docs.executionState.revision += 1;
    await saveDocs(root, docs);

    const result = runValidate(root, ['--json']);
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'failed');
    assert.ok(report.errors.some((entry) => entry.includes('selección determinista esperada')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('estado paused: devuelve NO_READY_TASK', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.executionState.status = 'paused';
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.classification, 'NO_READY_TASK');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('estado completed: devuelve NO_READY_TASK', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.executionState.status = 'completed';
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.classification, 'NO_READY_TASK');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('intentos agotados: no selecciona una tarea sin intentos restantes', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.executionState.tasks = [{
      taskId: 'TASK-001',
      status: 'failed_retryable',
      attemptCount: 3,
      maxAttempts: 3,
      activeRunId: null,
      reservation: null,
      blocker: null,
      lastResult: null,
      updatedAt: null,
    }];
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.classification, 'NO_READY_TASK');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('IDs descriptivos: acepta tareas canónicas no numéricas', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.taskPlan.tasks = [{
      id: 'TASK-API-DOMAINS',
      title: 'Tarea descriptiva',
      file: '.devflow/task-planner/tasks/TASK-API-DOMAINS.md',
      epicId: 'EPIC-DOM-001',
      type: 'enabling',
      dependencyIds: [],
      createsCapabilityIds: [],
      consumesCapabilityIds: [],
      behaviorIds: [],
      semanticKeys: [],
      requirementCoverage: [],
    }];
    docs.epicPlan.epics[0].taskIds = ['TASK-API-DOMAINS'];
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.selectedTaskId, 'TASK-API-DOMAINS');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('IDs equivalentes ambiguos: rechaza TASK-6 y TASK-006 en el mismo plan', async () => {
  const root = await createFixture();
  try {
    const docs = await loadDocs(root);
    docs.taskPlan.tasks = [
      {
        id: 'TASK-6',
        title: 'Forma corta',
        file: '.devflow/task-planner/tasks/TASK-6.md',
        epicId: 'EPIC-DOM-001',
        type: 'enabling',
        dependencyIds: [],
        createsCapabilityIds: [],
        consumesCapabilityIds: [],
        behaviorIds: [],
        semanticKeys: [],
        requirementCoverage: [],
      },
      {
        id: 'TASK-006',
        title: 'Forma canónica',
        file: '.devflow/task-planner/tasks/TASK-006.md',
        epicId: 'EPIC-DOM-001',
        type: 'enabling',
        dependencyIds: [],
        createsCapabilityIds: [],
        consumesCapabilityIds: [],
        behaviorIds: [],
        semanticKeys: [],
        requirementCoverage: [],
      },
    ];
    docs.epicPlan.epics[0].taskIds = ['TASK-6', 'TASK-006'];
    await saveDocs(root, docs);

    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const selection = await selectionFile(root);
    assert.equal(selection.classification, 'INPUT_INVALID');
    assert.ok(selection.issues.some((entry) => entry.code === 'TASK_ID_NUMERIC_COLLISION'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('validate-next-task acepta una selección correcta', async () => {
  const root = await createFixture();
  try {
    assert.equal(runSelect(root).status, 0);
    const result = runValidate(root, ['--json']);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'passed');
    assert.equal(report.classification, 'TASK_SELECTED');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('validate-next-task rechaza una selección manipulada', async () => {
  const root = await createFixture();
  try {
    assert.equal(runSelect(root).status, 0);
    const currentSelection = await selectionFile(root);
    currentSelection.selectedTaskId = 'TASK-007';
    await writeJson(path.join(root, '.devflow', 'execution', 'selection.json'), currentSelection);

    const result = runValidate(root, ['--json']);
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'failed');
    assert.ok(report.errors.some((entry) => entry.includes('selección determinista esperada')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('select-next-task no modifica execution-state.json', async () => {
  const root = await createFixture();
  try {
    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    const result = runSelect(root);
    assert.equal(result.status, 0, result.stderr);
    const after = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(after, before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
