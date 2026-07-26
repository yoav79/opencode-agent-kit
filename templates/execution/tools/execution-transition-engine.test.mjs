#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_PATH = path.join(HERE, 'execution-transition-engine.mjs');
const HELPERS_PATH = path.join(HERE, 'execution-contract-helpers.mjs');
const CLI_TOOL = path.join(HERE, 'prepare-task-run.mjs');
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

async function fixture({ revision = 0, selectionTaskId = 'TASK-006' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'execution-engine-'));
  await mkdir(path.join(root, '.devflow', 'execution', 'runs'), { recursive: true });

  const executionState = await json(EXECUTION_TEMPLATE);
  executionState.project.id = 'demo-project';
  if (revision !== 0) executionState.revision = revision;
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

async function fixtureSpawn({ revision = 0, selectionTaskId = 'TASK-006' } = {}) {
  const root = await fixture({ revision, selectionTaskId });
  await mkdir(path.join(root, '.devflow', 'execution', 'tools'), { recursive: true });
  await cp(CLI_TOOL, path.join(root, '.devflow', 'execution', 'tools', 'prepare-task-run.mjs'));
  await cp(ENGINE_PATH, path.join(root, '.devflow', 'execution', 'tools', 'execution-transition-engine.mjs'));
  await cp(HELPERS_PATH, path.join(root, '.devflow', 'execution', 'tools', 'execution-contract-helpers.mjs'));
  return root;
}

const { prepareTaskRun } = await import(ENGINE_PATH);
const LOCK_PATH = '.devflow/execution/lock';

async function callEngine(root, { attempt = null, at = DEFAULT_TS, extraEnv = {} } = {}) {
  const prev = {};
  const env = { NODE_ENV: 'test', TIMESTAMP_TOOL_TEST_NOW: at, ...extraEnv };
  for (const key of Object.keys(env)) {
    prev[key] = process.env[key];
    process.env[key] = env[key];
  }
  try {
    return await prepareTaskRun({ root, attempt });
  } finally {
    for (const key of Object.keys(env)) {
      if (prev[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prev[key];
      }
    }
  }
}

async function stateFile(root) {
  return json(path.join(root, '.devflow', 'execution', 'execution-state.json'));
}

async function readOrNull(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function spawnCli(root, args = [], at = DEFAULT_TS) {
  return new Promise((resolve) => {
    const child = spawn('node', ['.devflow/execution/tools/prepare-task-run.mjs', ...args], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test', TIMESTAMP_TOOL_TEST_NOW: at },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (status) => resolve({ status, stdout: stdout.trim(), stderr: stderr.trim() }));
  });
}

test('1. Reserva normal: crea run, evidencia, estado reservado, revisión incrementada, timestamps, journal retirado', async () => {
  const root = await fixture();
  try {
    const report = await callEngine(root);

    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.runPath, '.devflow/execution/runs/TASK-006/attempt-01');
    assert.equal(report.previousRevision, 0);
    assert.equal(report.newRevision, 1);
    assert.equal(report.recovered, false);
    assert.equal(report.idempotent, false);

    const state = await stateFile(root);
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
    const selectionRaw = await readFile(path.join(root, '.devflow', 'execution', 'selection.json'), 'utf8');
    assert.equal(evidence, selectionRaw);

    const journal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.equal(journal, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('2. Selección stale: cuando revisión de selección < revisión de estado, clasifica STALE_SELECTION sin modificar estado', async () => {
  const root = await fixture({ revision: 1 });
  try {
    await writeFile(
      path.join(root, '.devflow', 'execution', 'selection.json'),
      `${JSON.stringify(selection(0), null, 2)}\n`,
      'utf8',
    );

    const before = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');

    const report = await callEngine(root);
    assert.equal(report.classification, 'STALE_SELECTION');

    const after = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(after, before);

    const evidence = await readOrNull(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json'));
    assert.equal(evidence, null);

    const journal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.equal(journal, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('3. Repetición idempotente: misma solicitud exacta produce mismo resultado sin incrementar revisión', async () => {
  const root = await fixture();
  try {
    const first = await callEngine(root, { attempt: 1 });
    assert.equal(first.classification, 'RUN_PREPARED');
    assert.equal(first.newRevision, 1);

    const stateBefore = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');

    const second = await callEngine(root, { attempt: 1 });
    assert.equal(second.classification, 'IDEMPOTENT');
    assert.equal(second.taskId, 'TASK-006');
    assert.equal(second.attempt, 1);
    assert.equal(second.newRevision, 1);
    assert.equal(second.idempotent, true);

    const stateAfter = await readFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), 'utf8');
    assert.equal(stateAfter, stateBefore);

    const runDir = path.join(root, '.devflow', 'execution', 'runs', 'TASK-006');
    const entries = await readdir(runDir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0], 'attempt-01');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('4. Concurrencia: dos procesos reales desde la misma revisión produce exactamente un ganador', async () => {
  const root = await fixtureSpawn({ revision: 0 });
  try {
    const [resultA, resultB] = await Promise.all([
      spawnCli(root, [], DEFAULT_TS),
      spawnCli(root, [], DEFAULT_TS),
    ]);

    const winners = [resultA, resultB].filter((r) => r.status === 0);
    const losers = [resultA, resultB].filter((r) => r.status === 1);

    assert.equal(winners.length, 1,
      `Debe haber exactamente un ganador. stdout A: ${resultA.stdout}, stdout B: ${resultB.stdout}`);
    assert.equal(losers.length, 1,
      `Debe haber exactamente un perdedor. stderr A: ${resultA.stderr}, stderr B: ${resultB.stderr}`);

    const loserStderr = losers[0].stderr.trim();
    assert.ok(loserStderr === 'STALE_SELECTION' || loserStderr === 'RUN_CONFLICT',
      `El perdedor debe recibir clasificación contractual, obtuvo: ${loserStderr}`);

    const winner = JSON.parse(winners[0].stdout);
    assert.equal(winner.classification, 'RUN_PREPARED');

    const state = await stateFile(root);
    assert.equal(state.revision, 1);
    assert.equal(state.tasks.length, 1);
    assert.equal(state.tasks[0].status, 'reserved');

    const runEntries = await readdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006'));
    assert.equal(runEntries.length, 1);
    assert.equal(runEntries[0], 'attempt-01');

    const journal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.equal(journal, null);

    const lockDir = path.join(root, LOCK_PATH);
    const lockExists = await readOrNull(path.join(lockDir, 'pid')).then((v) => v !== null, () => false);
    assert.equal(lockExists, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('5. Fallo después del journal: recuperación limpia sin evidencia ni estado, sin doble incremento de revisión', async () => {
  const root = await fixture();
  try {
    await assert.rejects(
      () => callEngine(root, { extraEnv: { FAULT_INJECT_AFTER_JOURNAL: '1' } }),
      { name: 'CrashSimulationError' },
    );

    const journal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.notEqual(journal, null, 'El journal debe persistir después del fault');

    const evidence = await readOrNull(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json'));
    assert.equal(evidence, null, 'No debe crearse evidencia');

    const state = await stateFile(root);
    assert.equal(state.revision, 0, 'Estado no debe modificarse');

    const report = await callEngine(root);
    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.newRevision, 1);
    assert.equal(report.recovered, false);

    const finalState = await stateFile(root);
    assert.equal(finalState.revision, 1, 'Revisión incrementada una sola vez');
    assert.equal(finalState.tasks[0].status, 'reserved');

    const finalJournal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.equal(finalJournal, null, 'Journal debe eliminarse después de transición exitosa');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('6. Fallo después de crear evidencia: recupera verificando que evidencia corresponde a la selección', async () => {
  const root = await fixture();
  try {
    await assert.rejects(
      () => callEngine(root, { extraEnv: { FAULT_INJECT_AFTER_EVIDENCE: '1' } }),
      { name: 'CrashSimulationError' },
    );

    const evidence = await readFile(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json'), 'utf8');
    assert.notEqual(evidence, null, 'Evidencia debe existir');

    const state = await stateFile(root);
    assert.equal(state.revision, 0, 'Estado no debe estar actualizado');

    const journal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.notEqual(journal, null, 'Journal debe persistir');

    const report = await callEngine(root);
    assert.equal(report.classification, 'RECOVERED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.recovered, true);
    assert.equal(report.newRevision, 1);

    const finalState = await stateFile(root);
    assert.equal(finalState.revision, 1);
    assert.equal(finalState.tasks[0].status, 'reserved');

    const runEntries = await readdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006'));
    assert.equal(runEntries.length, 1, 'No debe crearse un segundo intento');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('7. Fallo después de escribir estado: reconciliación sin doble incremento ni duplicación', async () => {
  const root = await fixture();
  try {
    await assert.rejects(
      () => callEngine(root, { extraEnv: { FAULT_INJECT_AFTER_STATE: '1' } }),
      { name: 'CrashSimulationError' },
    );

    const state = await stateFile(root);
    assert.equal(state.revision, 1, 'Estado debe estar actualizado');
    assert.equal(state.tasks[0].status, 'reserved');

    const journal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.notEqual(journal, null, 'Journal debe persistir (fault antes de limpiar)');

    const evidencePath = path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json');
    const evidence = await readOrNull(evidencePath);
    assert.notEqual(evidence, null, 'Evidencia debe existir');

    const report = await callEngine(root);
    assert.equal(report.classification, 'IDEMPOTENT', 'Ya reservado con estado → IDEMPOTENT');
    assert.equal(report.newRevision, 1, 'Revisión no debe incrementar otra vez');
    assert.equal(report.idempotent, true);

    const finalState = await stateFile(root);
    assert.equal(finalState.revision, 1);
    assert.equal(finalState.timestamps.updatedAt, DEFAULT_TS, 'Timestamps no deben modificarse');

    const runEntries = await readdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006'));
    assert.equal(runEntries.length, 1, 'No debe haber duplicación de archivos');

    const finalJournal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.equal(finalJournal, null, 'Journal debe limpiarse');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('8. Evidencia existente con journal y selección verificable: recuperación automática (RECOVERED)', async () => {
  const root = await fixture();
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

    const report = await callEngine(root);
    assert.equal(report.classification, 'RECOVERED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.recovered, true);
    assert.equal(report.newRevision, 1);

    const state = await stateFile(root);
    assert.equal(state.revision, 1);
    assert.equal(state.tasks[0].status, 'reserved');
    assert.equal(state.tasks[0].reservation.token, '.devflow/execution/runs/TASK-006/attempt-01');

    const journalGone = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.equal(journalGone, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('8b. Evidencia existente sin coincidir con selección: exige RUN_CONFLICT', async () => {
  const root = await fixture();
  try {
    const runDir = path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01');
    await mkdir(runDir, { recursive: true });
    await writeFile(
      path.join(runDir, 'selection.json'),
      `${JSON.stringify(selection(0, 'TASK-999'), null, 2)}\n`,
      'utf8',
    );

    const report = await callEngine(root, { attempt: 1 });
    assert.equal(report.classification, 'RUN_CONFLICT', 'Evidencia que no coincide debe producir RUN_CONFLICT');

    const state = await stateFile(root);
    assert.equal(state.revision, 0, 'Estado no debe modificarse');
    assert.equal(state.tasks.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('9. Estado reservado sin evidencia ni journal recuperable: produce conflicto explícito sin modificar estado', async () => {
  const root = await fixture({ revision: 1 });
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
        stateRevision: 1,
      },
      blocker: null,
      lastResult: null,
      updatedAt: null,
    });
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

    const selectionRaw = `${JSON.stringify(selection(1), null, 2)}\n`;
    await writeFile(
      path.join(root, '.devflow', 'execution', 'selection.json'),
      selectionRaw,
      'utf8',
    );

    const before = await readFile(statePath, 'utf8');

    await assert.rejects(
      () => callEngine(root),
      { name: 'EngineError', code: 'RUN_CONFLICT' },
    );

    const after = await readFile(statePath, 'utf8');
    assert.equal(after, before, 'Estado no debe modificarse');

    const evidence = await readOrNull(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01', 'selection.json'));
    assert.equal(evidence, null, 'No debe crearse evidencia nueva');

    const journal = await readOrNull(path.join(root, '.devflow', 'execution', 'transition-journal.json'));
    assert.equal(journal, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('10. Journal corrupto (JSON inválido): se limpia y el engine continúa sin modificar estado previo', async () => {
  const root = await fixture();
  try {
    const jPath = path.join(root, '.devflow', 'execution', 'transition-journal.json');
    await writeFile(jPath, 'not valid json at all', 'utf8');

    const report = await callEngine(root);
    assert.equal(report.classification, 'RUN_PREPARED', 'Journal corrupto debe ignorarse');

    const state = await stateFile(root);
    assert.equal(state.revision, 1);

    const journalAfter = await readOrNull(jPath);
    assert.equal(journalAfter, null, 'Journal corrupto debe eliminarse');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('10b. Journal con schemaVersion incompatible: se limpia y el engine continúa normalmente', async () => {
  const root = await fixture();
  try {
    const jPath = path.join(root, '.devflow', 'execution', 'transition-journal.json');
    await writeFile(jPath, JSON.stringify({
      schemaVersion: 99,
      transitionType: 'prepare-task-run',
      taskId: 'TASK-006',
      attempt: 1,
      runPath: '.devflow/execution/runs/TASK-006/attempt-99',
      expectedRevision: 0,
      targetRevision: 1,
      phase: 'started',
    }));

    const report = await callEngine(root);
    assert.equal(report.classification, 'RUN_PREPARED', 'Journal incompatible se limpia y el engine continúa');

    const state = await stateFile(root);
    assert.equal(state.revision, 1, 'Engine debe poder continuar después de limpiar journal');

    const journalAfter = await readOrNull(jPath);
    assert.equal(journalAfter, null, 'Journal incompatible debe eliminarse');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('10c. Journal con transitionType desconocido: se limpia y el engine continúa normalmente', async () => {
  const root = await fixture();
  try {
    const jPath = path.join(root, '.devflow', 'execution', 'transition-journal.json');
    await writeFile(jPath, JSON.stringify({
      schemaVersion: 1,
      transitionType: 'unknown-transition',
      taskId: 'TASK-006',
      attempt: 1,
      runPath: '.devflow/execution/runs/TASK-006/attempt-99',
      expectedRevision: 0,
      targetRevision: 99,
      phase: 'started',
      officialTimestamp: DEFAULT_TS,
      expectedArtifacts: [
        '.devflow/execution/runs/TASK-006/attempt-99/selection.json',
        '.devflow/execution/execution-state.json',
      ],
      createdAt: DEFAULT_TS,
    }));

    const report = await callEngine(root);
    assert.equal(report.classification, 'RUN_PREPARED', 'Journal desconocido se limpia y el engine continúa');

    const state = await stateFile(root);
    assert.equal(state.revision, 1, 'Engine debe poder continuar');

    const journalAfter = await readOrNull(jPath);
    assert.equal(journalAfter, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('11a. Intentos: resolución automática del siguiente intento (max+1)', async () => {
  const root = await fixture({ revision: 2 });
  try {
    await mkdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01'), { recursive: true });
    await mkdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-02'), { recursive: true });

    const report = await callEngine(root);
    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.attempt, 3);
    assert.equal(report.runPath, '.devflow/execution/runs/TASK-006/attempt-03');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('11b. Intentos: intento explícito produce RUN_PREPARED en el número indicado', async () => {
  const root = await fixture({ revision: 3 });
  try {
    const report = await callEngine(root, { attempt: 5 });
    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.attempt, 5);

    const state = await stateFile(root);
    assert.equal(state.tasks[0].reservation.token, '.devflow/execution/runs/TASK-006/attempt-05');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('11c. Intentos: conflicto por intento ya ocupado con evidencia diferente', async () => {
  const root = await fixture();
  try {
    const runDir = path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-05');
    await mkdir(runDir, { recursive: true });
    await writeFile(
      path.join(runDir, 'selection.json'),
      `${JSON.stringify(selection(0, 'TASK-999'), null, 2)}\n`,
      'utf8',
    );

    const report = await callEngine(root, { attempt: 5 });
    assert.equal(report.classification, 'RUN_CONFLICT');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('11d. Intentos: límite de maxAttempts agotado (EngineError con RUN_CONFLICT)', async () => {
  const root = await fixture();
  try {
    const statePath = path.join(root, '.devflow', 'execution', 'execution-state.json');
    const state = await json(statePath);
    state.tasks.push({
      taskId: 'TASK-006',
      status: 'pending',
      attemptCount: 3,
      maxAttempts: 3,
      activeRunId: null,
      reservation: null,
      blocker: null,
      lastResult: null,
      updatedAt: null,
    });
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

    await assert.rejects(
      () => callEngine(root),
      { name: 'EngineError', code: 'RUN_CONFLICT' },
    );

    const stateAfter = await stateFile(root);
    assert.equal(stateAfter.revision, 0, 'Estado no debe modificarse');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('11e. Intentos: sin huecos accidentales (intentos 1 y 3 existen → next es 4, no 2)', async () => {
  const root = await fixture({ revision: 4 });
  try {
    await mkdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01'), { recursive: true });
    await mkdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-03'), { recursive: true });

    const report = await callEngine(root);
    assert.equal(report.attempt, 4, 'Debe resolver max+1 = 4, no 2');
    assert.equal(report.runPath, '.devflow/execution/runs/TASK-006/attempt-04');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('12a. Lock abandonado: recuperación segura con PID inexistente', async () => {
  const root = await fixture();
  try {
    const lockDir = path.join(root, LOCK_PATH);
    await mkdir(lockDir, { recursive: true });
    await writeFile(path.join(lockDir, 'pid'), '999999999', 'utf8');
    await writeFile(path.join(lockDir, 'host'), 'phantom-host', 'utf8');
    await writeFile(path.join(lockDir, 'ts'), String(Date.now() - 120000), 'utf8');

    const report = await callEngine(root);
    assert.equal(report.classification, 'RUN_PREPARED');
    assert.equal(report.taskId, 'TASK-006');
    assert.equal(report.attempt, 1);
    assert.equal(report.newRevision, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('12b. Lock abandonado: lock con PID vivo no se considera abandonado y se respeta el timeout reducido', async () => {
  const root = await fixture();
  try {
    const lockDir = path.join(root, LOCK_PATH);
    await mkdir(lockDir, { recursive: true });
    await writeFile(path.join(lockDir, 'pid'), String(process.pid), 'utf8');
    await writeFile(path.join(lockDir, 'host'), os.hostname(), 'utf8');
    await writeFile(path.join(lockDir, 'ts'), String(Date.now()), 'utf8');

    const started = Date.now();
    await assert.rejects(
      () => callEngine(root, { extraEnv: { LOCK_TIMEOUT_MS: '1000', LOCK_RETRY_MS: '100' } }),
    );
    const elapsed = Date.now() - started;
    assert.ok(elapsed >= 900, `Timeout debe exceder el mínimo configurado, tomó ${elapsed}ms`);
    assert.ok(elapsed < 10000, `Timeout debe respetar el límite, tomó ${elapsed}ms`);

    const state = await stateFile(root);
    assert.equal(state.revision, 0, 'Estado no debe modificarse');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
