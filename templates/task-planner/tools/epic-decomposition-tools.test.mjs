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
const RESERVE_SOURCE = path.join(HERE, 'reserve-task-ids.mjs');
const ASSEMBLE_SOURCE = path.join(HERE, 'assemble-epic-task-batch.mjs');

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function withFixture(mutate) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'task-planner-phase8-'));
  await cp(FIXTURE_ROOT, root, { recursive: true });
  await cp(RESERVE_SOURCE, path.join(root, '.devflow', 'task-planner', 'tools', 'reserve-task-ids.mjs'));
  await cp(ASSEMBLE_SOURCE, path.join(root, '.devflow', 'task-planner', 'tools', 'assemble-epic-task-batch.mjs'));
  try {
    if (mutate) await mutate(root);
    return root;
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}

async function resetToPreDecomposition(root) {
  const epicFile = path.join(root, '.devflow', 'task-planner', 'epic-plan.json');
  const epicPlan = await json(epicFile);
  epicPlan.status = 'generated';
  for (const epic of epicPlan.epics) {
    epic.taskIds = [];
    epic.decomposed = false;
  }
  await writeJson(epicFile, epicPlan);

  const capabilityFile = path.join(root, '.devflow', 'task-planner', 'capability-map.json');
  const capabilityMap = await json(capabilityFile);
  capabilityMap.status = 'generated';
  for (const capability of capabilityMap.capabilities) {
    capability.ownerTaskId = null;
  }
  await writeJson(capabilityFile, capabilityMap);

  const taskFile = path.join(root, '.devflow', 'task-planner', 'task-plan.json');
  const taskPlan = await json(taskFile);
  taskPlan.status = 'initialized';
  taskPlan.tasks = [];
  await writeJson(taskFile, taskPlan);
}

test('reserve-task-ids reserva TASK-### de forma estable por épica', async () => {
  const root = await withFixture(resetToPreDecomposition);
  try {
    const run = spawnSync('node', ['.devflow/task-planner/tools/reserve-task-ids.mjs', '--epic', 'EPIC-DOM-001'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(run.status, 0, run.stderr);

    const summary = JSON.parse(run.stdout);
    assert.equal(summary.tool, 'reserve-task-ids.mjs');
    assert.equal(summary.results.length, 1);
    assert.deepEqual(summary.results[0].createdTaskIds, [
      'TASK-001',
      'TASK-002',
      'TASK-003',
      'TASK-004',
      'TASK-005',
      'TASK-006',
      'TASK-007',
    ]);

    const draft = await json(path.join(root, '.devflow', 'task-planner', 'drafts', 'EPIC-DOM-001.task-ids.json'));
    assert.deepEqual(draft.capabilityTaskMap, {
      'CAP-SCAFFOLD': 'TASK-001',
      'CAP-API-LAYER': 'TASK-002',
      'CAP-DOM-CREATE': 'TASK-003',
      'CAP-DOM-DISABLE': 'TASK-004',
      'CAP-DOM-DELETE': 'TASK-005',
      'CAP-DOM-ENABLE': 'TASK-006',
      'CAP-DOM-VALIDATE': 'TASK-007',
    });

    const rerun = spawnSync('node', ['.devflow/task-planner/tools/reserve-task-ids.mjs', '--epic', 'EPIC-DOM-001'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(rerun.status, 0, rerun.stderr);
    assert.deepEqual(JSON.parse(rerun.stdout).results[0].capabilityTaskMap, draft.capabilityTaskMap);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('assemble-epic-task-batch congela semántica estructurada sin narrativa libre', async () => {
  const root = await withFixture(resetToPreDecomposition);
  try {
    const reserve = spawnSync('node', ['.devflow/task-planner/tools/reserve-task-ids.mjs', '--epic', 'EPIC-DOM-001'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(reserve.status, 0, reserve.stderr);

    const assemble = spawnSync('node', ['.devflow/task-planner/tools/assemble-epic-task-batch.mjs', '--epic', 'EPIC-DOM-001'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(assemble.status, 0, assemble.stderr);

    const batch = await json(path.join(root, '.devflow', 'task-planner', 'drafts', 'EPIC-DOM-001.task-batch.json'));
    const partial = await json(path.join(root, '.devflow', 'task-planner', 'drafts', 'EPIC-DOM-001.task-plan.partial.json'));

    assert.equal(batch.status, 'assembled');
    assert.equal(batch.epicId, 'EPIC-DOM-001');
    assert.equal(batch.taskSkeletons.length, 7);
    assert.equal(partial.tasks.length, 7);

    const createTask = batch.taskSkeletons.find((skeleton) => skeleton.capabilityId === 'CAP-DOM-CREATE');
    assert.deepEqual(createTask.task.behaviorIds, ['BEH-DOM-CREATE']);
    assert.deepEqual(createTask.task.semanticKeys, ['dom.create']);
    assert.deepEqual(createTask.sourceFunctionIds, ['FUN-DOM-CREATE']);
    assert.deepEqual(createTask.backendBindings, ['mailctl domain create']);
    assert.deepEqual(createTask.task.createsCapabilityIds, ['CAP-DOM-CREATE']);
    assert.deepEqual(createTask.task.consumesCapabilityIds, ['CAP-API-LAYER']);
    assert.deepEqual(createTask.task.dependencyIds, ['TASK-002']);
    assert.deepEqual(createTask.task.requirementCoverage, [
      {
        requirementId: 'REQ-DOM-001',
        behaviorIds: ['BEH-DOM-CREATE'],
        scopeItemIds: ['SCOPE-003'],
        acceptanceCriterionIds: ['AC-003'],
      },
    ]);
    assert.deepEqual(createTask.scopeItemIds, ['SCOPE-003']);
    assert.deepEqual(createTask.acceptanceCriterionIds, ['AC-003']);

    const apiTask = batch.taskSkeletons.find((skeleton) => skeleton.capabilityId === 'CAP-API-LAYER');
    assert.deepEqual(apiTask.task.behaviorIds, []);
    assert.deepEqual(apiTask.task.semanticKeys, []);
    assert.deepEqual(apiTask.sourceFunctionIds, []);
    assert.deepEqual(apiTask.backendBindings, []);
    assert.deepEqual(apiTask.task.consumesCapabilityIds, ['CAP-SCAFFOLD']);
    assert.deepEqual(apiTask.task.dependencyIds, ['TASK-001']);
    assert.deepEqual(apiTask.task.requirementCoverage, []);

    assert.deepEqual(partial.tasks.map((task) => task.id), batch.createdTaskIds);
    assert.equal(JSON.stringify(batch).includes('## Objetivo'), false);
    assert.equal(JSON.stringify(batch).includes('Cualquier behavior'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
