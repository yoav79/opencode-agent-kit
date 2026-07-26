#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PREPARE_TOOL = path.join(HERE, 'prepare-task-run.mjs');
const TOUCH_TOOL = path.join(HERE, 'touch-execution-state.mjs');
const SELECT_TOOL = path.join(HERE, '..', '..', 'next-task', 'tools', 'select-next-task.mjs');
const TIMESTAMP_TOOL = path.join(HERE, '..', '..', 'shared', 'tools', 'timestamp.mjs');
const EXECUTION_TEMPLATE = path.join(HERE, '..', 'execution-state.json');

async function json(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function selection(revision, taskId = 'TASK-006') {
  return {
    schemaVersion: 1,
    sourceSnapshot: {
      planningVersion: 1,
      epicPlanContentHash: `sha256:${'a'.repeat(64)}`,
      taskPlanContentHash: `sha256:${'b'.repeat(64)}`,
      capabilityMapContentHash: `sha256:${'c'.repeat(64)}`,
      executionStateRevision: revision,
    },
    selectedTaskId: taskId,
    epicId: 'EPIC-001',
    executionWave: 1,
    selectionReason: {
      dependenciesCompleted: true,
      attemptsAvailable: true,
      taskStatus: 'pending',
      readyTaskCount: 1,
      unlocksTaskIds: [],
      tieBreaker: 'lowest-execution-wave-then-lowest-task-id',
    },
    otherReadyTaskIds: [],
    classification: 'TASK_SELECTED',
    issues: [],
  };
}

async function fixture({ revision = 0, selectionTaskId = 'TASK-006' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'execution-run-'));
  await mkdir(path.join(root, '.devflow', 'execution', 'tools'), { recursive: true });
  await mkdir(path.join(root, '.devflow', 'execution', 'runs'), { recursive: true });
  await mkdir(path.join(root, 'xdg', 'opencode', 'templates', 'shared', 'tools'), { recursive: true });

  await cp(PREPARE_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'prepare-task-run.mjs'));
  await cp(TOUCH_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'touch-execution-state.mjs'));
  await cp(SELECT_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'select-next-task.mjs'));
  await cp(TIMESTAMP_TOOL, path.join(root, 'xdg', 'opencode', 'templates', 'shared', 'tools', 'timestamp.mjs'));

  const executionState = await json(EXECUTION_TEMPLATE);
  executionState.project.id = 'demo-project';
  executionState.revision = revision;
  await writeFile(
    path.join(root, '.devflow', 'execution', 'execution-state.json'),
    `${JSON.stringify(executionState, null, 2)}\n`,
    'utf8',
  );
  await writeFile(
    path.join(root, '.devflow', 'execution', 'selection.json'),
    `${JSON.stringify(selection(revision, selectionTaskId), null, 2)}\n`,
    'utf8',
  );

  return root;
}

function run(root, args = [], at = '2026-07-25T12:00:00.000Z') {
  return spawnSync('node', ['.devflow/execution/tools/prepare-task-run.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      XDG_CONFIG_HOME: path.join(root, 'xdg'),
      TIMESTAMP_TOOL_TEST_NOW: at,
    },
  });
}

test('prepara el primer intento y reserva la tarea sin incrementar attemptCount', async () => {
  const root = await fixture();
  try {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);

    const report = JSON.parse(result.stdout);
    assert.deepEqual(report, {
      taskId: 'TASK-006',
      attempt: 1,
      runPath: '.devflow/execution/runs/TASK-006/attempt-01',
      newRevision: 1,
      status: 'prepared',
    });

    const state = await json(path.join(root, '.devflow', 'execution', 'execution-state.json'));
    assert.equal(state.revision, 1);
    assert.equal(state.timestamps.createdAt, '2026-07-25T12:00:00.000Z');
    assert.equal(state.timestamps.updatedAt, '2026-07-25T12:00:00.000Z');
    assert.deepEqual(state.tasks, [{
      taskId: 'TASK-006',
      status: 'reserved',
      attemptCount: 0,
      maxAttempts: 3,
      activeRunId: null,
      reservation: {
        token: '.devflow/execution/runs/TASK-006/attempt-01',
        reservedAt: '2026-07-25T12:00:00.000Z',
        stateRevision: 0,
      },
      blocker: null,
      lastResult: null,
      updatedAt: null,
    }]);

    const evidence = await readFile(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json'), 'utf8');
    const globalSelection = await readFile(path.join(root, '.devflow', 'execution', 'selection.json'), 'utf8');
    assert.equal(evidence, globalSelection);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('reutiliza un intento explícito ya preparado aunque la selección global ya esté stale', async () => {
  const root = await fixture();
  try {
    assert.equal(run(root, ['--attempt', '1']).status, 0);

    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    const result = run(root, ['--attempt', '1'], '2026-07-25T12:05:00.000Z');
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      taskId: 'TASK-006',
      attempt: 1,
      runPath: '.devflow/execution/runs/TASK-006/attempt-01',
      newRevision: 1,
      status: 'prepared',
    });

    const after = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(after, before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rechaza una selección stale sin crear run ni tocar estado', async () => {
  const root = await fixture({ revision: 1 });
  try {
    const selectionPath = path.join(root, '.devflow', 'execution', 'selection.json');
    await writeFile(selectionPath, `${JSON.stringify(selection(0), null, 2)}\n`, 'utf8');

    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    const result = run(root);
    assert.equal(result.status, 1);
    assert.equal(result.stderr.trim(), 'STALE_SELECTION');

    const after = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(after, before);

    await assert.rejects(readFile(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json'), 'utf8'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('detecta RUN_CONFLICT cuando la evidencia del intento ya existe y difiere', async () => {
  const root = await fixture();
  try {
    const runDir = path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-02');
    await mkdir(runDir, { recursive: true });
    await writeFile(path.join(runDir, 'selection.json'), `${JSON.stringify(selection(0, 'TASK-007'), null, 2)}\n`, 'utf8');

    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    const result = run(root, ['--attempt', '2']);
    assert.equal(result.status, 1);
    assert.equal(result.stderr.trim(), 'RUN_CONFLICT');

    const after = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(after, before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('sin attempt explícito usa max(existing)+1', async () => {
  const root = await fixture({ revision: 5 });
  try {
    await mkdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01'), { recursive: true });
    await mkdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-03'), { recursive: true });

    const result = run(root, [], '2026-07-25T12:10:00.000Z');
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      taskId: 'TASK-006',
      attempt: 4,
      runPath: '.devflow/execution/runs/TASK-006/attempt-04',
      newRevision: 6,
      status: 'prepared',
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
