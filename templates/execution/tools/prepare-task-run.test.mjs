#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PREPARE_TOOL = path.join(HERE, 'prepare-task-run.mjs');
const ENGINE = path.join(HERE, 'execution-transition-engine.mjs');
const HELPERS = path.join(HERE, 'execution-contract-helpers.mjs');
const SHARED_HELPER = path.join(HERE, '..', '..', 'shared', 'tools', 'devflow-runtime-helpers.mjs');
const SELECT_TOOL = path.join(HERE, '..', '..', 'next-task', 'tools', 'select-next-task.mjs');
const VALIDATE_TOOL = path.join(HERE, '..', '..', 'next-task', 'tools', 'validate-next-task.mjs');
const SELECTION_SCHEMA = path.join(HERE, '..', '..', 'next-task', 'task-selection.schema.json');
const JOURNAL_SCHEMA = path.join(HERE, '..', 'transition-journal.schema.json');
const EXECUTION_TEMPLATE = path.join(HERE, '..', 'execution-state.json');

const DEFAULT_TS = '2026-07-25T12:00:00.000Z';

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

function envFor(root, at = DEFAULT_TS) {
  return {
    ...process.env,
    NODE_ENV: 'test',
    TIMESTAMP_TOOL_TEST_NOW: at,
  };
}

async function fixture({ revision = 0, selectionTaskId = 'TASK-006' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'execution-run-'));
  await mkdir(path.join(root, '.devflow', 'execution', 'tools'), { recursive: true });
  await mkdir(path.join(root, '.devflow', 'execution', 'runs'), { recursive: true });
  await mkdir(path.join(root, '.devflow', 'shared', 'tools'), { recursive: true });

  await cp(PREPARE_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'prepare-task-run.mjs'));
  await cp(ENGINE, path.join(root, '.devflow', 'execution', 'tools', 'execution-transition-engine.mjs'));
  await cp(HELPERS, path.join(root, '.devflow', 'execution', 'tools', 'execution-contract-helpers.mjs'));
  await cp(SHARED_HELPER, path.join(root, '.devflow', 'shared', 'tools', 'devflow-runtime-helpers.mjs'));
  await cp(SELECT_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'select-next-task.mjs'));
  await cp(VALIDATE_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'validate-next-task.mjs'));
  await cp(SELECTION_SCHEMA, path.join(root, '.devflow', 'execution', 'task-selection.schema.json'));
  await cp(JOURNAL_SCHEMA, path.join(root, '.devflow', 'execution', 'transition-journal.schema.json'));

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

function run(root, args = [], at = DEFAULT_TS) {
  return spawnSync('node', ['.devflow/execution/tools/prepare-task-run.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: envFor(root, at),
  });
}

function spawnAsync(root, args = [], at = DEFAULT_TS) {
  return new Promise((resolve) => {
    const child = spawn('node', ['.devflow/execution/tools/prepare-task-run.mjs', ...args], {
      cwd: root,
      encoding: 'utf8',
      env: envFor(root, at),
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (status) => resolve({ status, stdout: stdout.trim(), stderr: stderr.trim() }));
  });
}

test('prepara el primer intento y reserva la tarea sin incrementar attemptCount', async () => {
  const root = await fixture();
  try {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);

    const report = JSON.parse(result.stdout);
    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.runPath, '.devflow/execution/runs/TASK-006/attempt-01');
    assert.equal(report.previousRevision, 0);
    assert.equal(report.newRevision, 1);
    assert.equal(report.recovered, false);
    assert.equal(report.idempotent, false);

    const state = await json(path.join(root, '.devflow', 'execution', 'execution-state.json'));
    assert.equal(state.revision, 1);
    assert.equal(state.timestamps.createdAt, DEFAULT_TS);
    assert.equal(state.timestamps.updatedAt, DEFAULT_TS);
    assert.deepEqual(state.tasks, [{
      taskId: 'TASK-006',
      status: 'reserved',
      attemptCount: 0,
      maxAttempts: 3,
      activeRunId: null,
      reservation: {
        token: '.devflow/execution/runs/TASK-006/attempt-01',
        reservedAt: DEFAULT_TS,
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

test('reutiliza un intento explícito ya preparado sin modificar estado', async () => {
  const root = await fixture();
  try {
    assert.equal(run(root, ['--attempt', '1']).status, 0);

    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    const result = run(root, ['--attempt', '1']);
    assert.equal(result.status, 0, result.stderr);

    const report = JSON.parse(result.stdout);
    assert.equal(report.classification, 'IDEMPOTENT');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.newRevision, 1);
    assert.equal(report.idempotent, true);

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

    await assert.rejects(
      readFile(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json'), 'utf8'),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('detecta RUN_CONFLICT cuando la evidencia del intento ya existe y difiere', async () => {
  const root = await fixture();
  try {
    const runDir = path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-02');
    await mkdir(runDir, { recursive: true });
    await writeFile(
      path.join(runDir, 'selection.json'),
      `${JSON.stringify(selection(0, 'TASK-007'), null, 2)}\n`,
      'utf8',
    );

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

    const result = run(root);
    assert.equal(result.status, 0, result.stderr);

    const report = JSON.parse(result.stdout);
    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 4);
    assert.equal(report.runPath, '.devflow/execution/runs/TASK-006/attempt-04');
    assert.equal(report.previousRevision, 5);
    assert.equal(report.newRevision, 6);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('detecta RUN_CONFLICT cuando la tarea ya está reservada en estado', async () => {
  const root = await fixture();
  try {
    const statePath = path.join(root, '.devflow', 'execution', 'execution-state.json');
    const state = await json(statePath);
    state.tasks.push({
      taskId: 'TASK-006',
      status: 'reserved',
      attemptCount: 0,
      maxAttempts: 3,
      activeRunId: null,
      reservation: {
        token: '.devflow/execution/runs/TASK-006/attempt-01',
        reservedAt: DEFAULT_TS,
        stateRevision: 0,
      },
      blocker: null,
      lastResult: null,
      updatedAt: null,
    });
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

    const result = run(root);
    assert.equal(result.status, 1);
    assert.equal(result.stderr.trim(), 'RUN_CONFLICT');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('falla con error claro si falta un artefacto obligatorio de next-task', async () => {
  const root = await fixture();
  try {
    await rm(path.join(root, '.devflow', 'execution', 'task-selection.schema.json'));

    const result = run(root);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Faltan artefactos obligatorios de next-task/);
    assert.match(result.stderr, /\.devflow\/execution\/task-selection\.schema\.json/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('concurrencia: dos procesos desde la misma revisión, solo uno gana', async () => {
  const root = await fixture({ revision: 0 });
  try {
    const resultA = spawnAsync(root, [], DEFAULT_TS);
    // Stagger to avoid both reading state before either acquires the lock
    await new Promise((r) => setTimeout(r, 100));
    const resultB = spawnAsync(root, [], DEFAULT_TS);
    const [rA, rB] = await Promise.all([resultA, resultB]);

    const winners = [rA, rB].filter((r) => r.status === 0);
    const losers = [rA, rB].filter((r) => r.status === 1);

    assert.equal(winners.length, 1,
      `Debe haber exactamente un ganador. stdout A: ${rA.stdout}, stdout B: ${rB.stdout}`);
    assert.equal(losers.length, 1,
      `Debe haber exactamente un perdedor. stderr A: ${rA.stderr}, stderr B: ${rB.stderr}`);
    assert.equal(losers[0].stderr.trim(), 'STALE_SELECTION');

    const winner = JSON.parse(winners[0].stdout);
    assert.equal(winner.classification, 'RUN_PREPARED');
    assert.equal(winner.newRevision, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('recupera journal pendiente con evidencia existente', async () => {
  const root = await fixture({ revision: 0 });
  try {
    const selectionRaw = `${JSON.stringify(selection(0), null, 2)}\n`;
    const runDir = path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01');
    await mkdir(runDir, { recursive: true });
    await writeFile(path.join(runDir, 'selection.json'), selectionRaw, 'utf8');

    const journal = {
      schemaVersion: 1,
      transitionType: 'prepare-task-run',
      taskId: 'TASK-006',
      attempt: 1,
      runPath: '.devflow/execution/runs/TASK-006/attempt-01',
      expectedRevision: 0,
      targetRevision: 1,
      selectionDigest: `sha256:${createHash('sha256').update(selectionRaw, 'utf8').digest('hex')}`,
      phase: 'started',
      officialTimestamp: DEFAULT_TS,
      expectedArtifacts: [
        '.devflow/execution/runs/TASK-006/attempt-01/selection.json',
        '.devflow/execution/execution-state.json',
      ],
      createdAt: DEFAULT_TS,
    };
    await writeFile(
      path.join(root, '.devflow', 'execution', 'transition-journal.json'),
      `${JSON.stringify(journal, null, 2)}\n`,
      'utf8',
    );

    const result = run(root, [], DEFAULT_TS);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    const report = JSON.parse(result.stdout);
    assert.equal(report.classification, 'RECOVERED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.recovered, true);
    assert.equal(report.idempotent, false);
    assert.equal(report.newRevision, 1);

    const state = await json(path.join(root, '.devflow', 'execution', 'execution-state.json'));
    assert.equal(state.revision, 1);
    assert.equal(state.tasks[0].status, 'reserved');
    assert.equal(state.tasks[0].reservation.token, '.devflow/execution/runs/TASK-006/attempt-01');

    const journalGone = await readFile(
      path.join(root, '.devflow', 'execution', 'transition-journal.json'),
      'utf8',
    ).then(() => false, () => true);
    assert.equal(journalGone, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('el journal se limpia después de una transición exitosa', async () => {
  const root = await fixture();
  try {
    const result = run(root);
    assert.equal(result.status, 0);

    const jPath = path.join(root, '.devflow', 'execution', 'transition-journal.json');
    const exists = await readFile(jPath, 'utf8').then(() => true, () => false);
    assert.equal(exists, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('el lock se libera incluso cuando falla la preparación', async () => {
  const root = await fixture({ revision: 1 });
  try {
    const selectionPath = path.join(root, '.devflow', 'execution', 'selection.json');
    await writeFile(selectionPath, `${JSON.stringify(selection(0), null, 2)}\n`, 'utf8');

    const result = run(root);
    assert.equal(result.status, 1);

    const lockDir = path.join(root, '.devflow', 'execution', 'lock');
    const lockExists = await readdir(lockDir).then(() => true, () => false);
    assert.equal(lockExists, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('recupera un lock abandonado con PID inexistente', async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, '.devflow', 'execution', 'lock'), { recursive: true });
    await writeFile(path.join(root, '.devflow', 'execution', 'lock', 'owner.json'), `${JSON.stringify({
      pid: 999999999,
      host: os.hostname(),
      createdAtMs: Date.now() - 120000,
    }, null, 2)}\n`, 'utf8');

    const result = run(root);
    assert.equal(result.status, 0, result.stderr);

    const report = JSON.parse(result.stdout);
    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);

    const state = await json(path.join(root, '.devflow', 'execution', 'execution-state.json'));
    assert.equal(state.revision, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rechaza una selección inválida con traversal y devuelve SELECTION_INVALID', async () => {
  const root = await fixture();
  try {
    const selectionPath = path.join(root, '.devflow', 'execution', 'selection.json');
    const payload = selection(0);
    payload.selectedTaskId = '../TASK-006';
    await writeFile(selectionPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    const result = run(root);
    assert.equal(result.status, 1);
    assert.equal(result.stderr.trim(), 'SELECTION_INVALID');

    const after = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(after, before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('bloquea un journal corrupto y lo preserva con JOURNAL_INVALID', async () => {
  const root = await fixture();
  try {
    const journalPath = path.join(root, '.devflow', 'execution', 'transition-journal.json');
    await writeFile(journalPath, 'not valid json', 'utf8');
    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');

    const result = run(root);
    assert.equal(result.status, 1);
    assert.equal(result.stderr.trim(), 'JOURNAL_INVALID');

    const after = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(after, before);
    assert.equal(await readFile(journalPath, 'utf8'), 'not valid json');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('un lock remoto agota timeout y devuelve LOCK_TIMEOUT por CLI', async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, '.devflow', 'execution', 'lock'), { recursive: true });
    await writeFile(path.join(root, '.devflow', 'execution', 'lock', 'owner.json'), `${JSON.stringify({
      pid: 999999999,
      host: 'remote-host',
      createdAtMs: Date.now() - 60000,
    }, null, 2)}\n`, 'utf8');

    const result = spawnSync('node', ['.devflow/execution/tools/prepare-task-run.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...envFor(root), LOCK_TIMEOUT_MS: '500', LOCK_RETRY_MS: '100' },
    });
    assert.equal(result.status, 2);
    assert.equal(result.stderr.trim(), 'LOCK_TIMEOUT');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('un lock parcial devuelve LOCK_INVALID por CLI', async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, '.devflow', 'execution', 'lock'), { recursive: true });
    await new Promise((resolve) => setTimeout(resolve, 25));

    const result = spawnSync('node', ['.devflow/execution/tools/prepare-task-run.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...envFor(root), LOCK_INIT_GRACE_MS: '1' },
    });
    assert.equal(result.status, 2);
    assert.equal(result.stderr.trim(), 'LOCK_INVALID');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
