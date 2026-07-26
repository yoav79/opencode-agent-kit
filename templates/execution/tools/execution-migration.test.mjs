#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATOR = path.join(HERE, 'migrate-execution-state-v1-to-v2.mjs');

function legacyState() {
  return {
    schemaVersion: 1,
    engine: {
      name: 'next-task',
      contractVersion: '1.0',
    },
    project: {
      id: 'demo-project',
      planningVersion: 1,
    },
    revision: 3,
    status: 'active',
    policy: {
      defaultMaxAttempts: 3,
      maxConcurrentTasks: 1,
    },
    tasks: [
      {
        taskId: 'TASK-006',
        status: 'reserved',
        attemptCount: 0,
        maxAttempts: 3,
        activeRunId: null,
        reservation: {
          token: '.devflow/execution/runs/TASK-006/attempt-01',
          reservedAt: '2026-07-26T12:00:00.000Z',
          stateRevision: 2,
        },
        blocker: null,
        lastResult: null,
        updatedAt: null,
      },
    ],
    timestamps: {
      createdAt: '2026-07-26T10:00:00.000Z',
      updatedAt: '2026-07-26T12:00:00.000Z',
    },
  };
}

test('migra execution-state v1 a v2 y crea backup', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'execution-migration-'));
  const statePath = path.join(root, 'execution-state.json');
  try {
    await writeFile(statePath, `${JSON.stringify(legacyState(), null, 2)}\n`, 'utf8');

    const result = spawnSync('node', [MIGRATOR, statePath], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Backup creado:/);
    assert.match(result.stdout, /schemaVersion 2/);

    const migrated = JSON.parse(await readFile(statePath, 'utf8'));
    const backup = JSON.parse(await readFile(`${statePath}.v1`, 'utf8'));

    assert.equal(migrated.schemaVersion, 2);
    assert.equal(migrated.engine.name, 'devflow-execution');
    assert.equal(migrated.engine.contractVersion, '2.0');
    assert.deepEqual(migrated.tasks, legacyState().tasks);
    assert.deepEqual(migrated.timestamps, legacyState().timestamps);
    assert.equal(backup.schemaVersion, 1);
    assert.equal(backup.engine.name, 'next-task');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('no reescribe un documento que ya está en v2', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'execution-migration-'));
  const statePath = path.join(root, 'execution-state.json');
  try {
    const current = legacyState();
    current.schemaVersion = 2;
    current.engine = {
      name: 'devflow-execution',
      contractVersion: '2.0',
    };
    await writeFile(statePath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');

    const result = spawnSync('node', [MIGRATOR, statePath], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /ya usa schemaVersion 2/);

    await assert.rejects(readFile(`${statePath}.v1`, 'utf8'));
    const persisted = JSON.parse(await readFile(statePath, 'utf8'));
    assert.deepEqual(persisted, current);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
