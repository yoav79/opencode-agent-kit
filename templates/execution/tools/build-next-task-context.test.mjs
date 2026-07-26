#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePreparedContextRequest } from './execution-contract-helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXECUTION_TEMPLATE = path.join(HERE, '..', 'execution-state.json');

async function json(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function selection(taskId = 'TASK-006', revision = 7) {
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

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'build-next-task-context-'));
  await mkdir(path.join(root, '.devflow', 'execution', 'runs'), { recursive: true });
  const state = await json(EXECUTION_TEMPLATE);
  state.project.id = 'demo-project';
  state.revision = 8;
  await writeFile(path.join(root, '.devflow', 'execution', 'execution-state.json'), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await writeFile(path.join(root, '.devflow', 'execution', 'selection.json'), `${JSON.stringify(selection(), null, 2)}\n`, 'utf8');
  return root;
}

async function writeRunSelection(root, taskId, attempt, payload = selection(taskId)) {
  const runDir = path.join(root, '.devflow', 'execution', 'runs', taskId, `attempt-${String(attempt).padStart(2, '0')}`);
  await mkdir(runDir, { recursive: true });
  await writeFile(path.join(runDir, 'selection.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function writeState(root, mutator) {
  const statePath = path.join(root, '.devflow', 'execution', 'execution-state.json');
  const state = await json(statePath);
  mutator(state);
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function expectCode(promise, code) {
  await assert.rejects(
    promise,
    (error) => error?.code === code,
  );
}

test('usa reservation.token como fuente canónica y no se vuelve ambiguo por intentos históricos', async () => {
  const root = await fixture();
  try {
    await writeRunSelection(root, 'TASK-006', 1);
    await writeRunSelection(root, 'TASK-006', 2);
    await writeState(root, (state) => {
      state.tasks = [{
        taskId: 'TASK-006',
        status: 'reserved',
        attemptCount: 0,
        maxAttempts: 3,
        activeRunId: null,
        reservation: {
          token: '.devflow/execution/runs/TASK-006/attempt-02',
          reservedAt: '2026-07-26T12:00:00.000Z',
          stateRevision: 7,
        },
        blocker: null,
        lastResult: null,
        updatedAt: null,
      }];
    });

    const resolved = await resolvePreparedContextRequest(root);
    assert.deepEqual(resolved, {
      taskId: 'TASK-006',
      attempt: 2,
      runPath: '.devflow/execution/runs/TASK-006/attempt-02',
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('usa activeRunId cuando la tarea está en estado activo', async () => {
  const root = await fixture();
  try {
    await writeRunSelection(root, 'TASK-006', 3);
    await writeState(root, (state) => {
      state.tasks = [{
        taskId: 'TASK-006',
        status: 'running',
        attemptCount: 1,
        maxAttempts: 3,
        activeRunId: '.devflow/execution/runs/TASK-006/attempt-03',
        reservation: null,
        blocker: null,
        lastResult: null,
        updatedAt: null,
      }];
    });

    const resolved = await resolvePreparedContextRequest(root);
    assert.equal(resolved.attempt, 3);
    assert.equal(resolved.runPath, '.devflow/execution/runs/TASK-006/attempt-03');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('falla con RUN_NOT_PREPARED si la tarea no tiene reserva ni run activo', async () => {
  const root = await fixture();
  try {
    await expectCode(resolvePreparedContextRequest(root), 'RUN_NOT_PREPARED');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('falla con EXECUTION_STATE_INVALID si el token persistido no cumple el contrato canónico', async () => {
  const root = await fixture();
  try {
    await writeState(root, (state) => {
      state.tasks = [{
        taskId: 'TASK-006',
        status: 'reserved',
        attemptCount: 0,
        maxAttempts: 3,
        activeRunId: null,
        reservation: {
          token: '.devflow/execution/runs/../escape/attempt-01',
          reservedAt: '2026-07-26T12:00:00.000Z',
          stateRevision: 7,
        },
        blocker: null,
        lastResult: null,
        updatedAt: null,
      }];
    });

    await expectCode(resolvePreparedContextRequest(root), 'EXECUTION_STATE_INVALID');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('falla con RUN_CONFLICT si el token apunta a otra tarea', async () => {
  const root = await fixture();
  try {
    await writeRunSelection(root, 'TASK-007', 1, selection('TASK-007'));
    await writeState(root, (state) => {
      state.tasks = [{
        taskId: 'TASK-006',
        status: 'reserved',
        attemptCount: 0,
        maxAttempts: 3,
        activeRunId: null,
        reservation: {
          token: '.devflow/execution/runs/TASK-007/attempt-01',
          reservedAt: '2026-07-26T12:00:00.000Z',
          stateRevision: 7,
        },
        blocker: null,
        lastResult: null,
        updatedAt: null,
      }];
    });

    await expectCode(resolvePreparedContextRequest(root), 'RUN_CONFLICT');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('falla con RUN_NOT_PREPARED si falta la evidencia selection.json del run activo', async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, '.devflow', 'execution', 'runs', 'TASK-006', 'attempt-01'), { recursive: true });
    await writeState(root, (state) => {
      state.tasks = [{
        taskId: 'TASK-006',
        status: 'reserved',
        attemptCount: 0,
        maxAttempts: 3,
        activeRunId: null,
        reservation: {
          token: '.devflow/execution/runs/TASK-006/attempt-01',
          reservedAt: '2026-07-26T12:00:00.000Z',
          stateRevision: 7,
        },
        blocker: null,
        lastResult: null,
        updatedAt: null,
      }];
    });

    await expectCode(resolvePreparedContextRequest(root), 'RUN_NOT_PREPARED');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('falla con EXECUTION_STATE_INVALID ante identidades duplicadas en execution-state', async () => {
  const root = await fixture();
  try {
    await writeRunSelection(root, 'TASK-006', 1);
    await writeState(root, (state) => {
      state.tasks = [
        {
          taskId: 'TASK-006',
          status: 'reserved',
          attemptCount: 0,
          maxAttempts: 3,
          activeRunId: null,
          reservation: {
            token: '.devflow/execution/runs/TASK-006/attempt-01',
            reservedAt: '2026-07-26T12:00:00.000Z',
            stateRevision: 7,
          },
          blocker: null,
          lastResult: null,
          updatedAt: null,
        },
        {
          taskId: 'TASK-6',
          status: 'pending',
          attemptCount: 0,
          maxAttempts: 3,
          activeRunId: null,
          reservation: null,
          blocker: null,
          lastResult: null,
          updatedAt: null,
        },
      ];
    });

    await expectCode(resolvePreparedContextRequest(root), 'EXECUTION_STATE_INVALID');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
