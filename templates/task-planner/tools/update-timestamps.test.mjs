#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = path.join(HERE, 'update-timestamps.mjs');
const STATE_TEMPLATE = path.join(HERE, '..', 'project-state.json');

async function json(file) { return JSON.parse(await readFile(file, 'utf8')); }

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'task-planner-time-'));
  await mkdir(path.join(root, 'task-planning', 'tools'), { recursive: true });
  await cp(TOOL, path.join(root, 'task-planning', 'tools', 'update-timestamps.mjs'));
  await cp(STATE_TEMPLATE, path.join(root, 'task-planning', 'project-state.json'));
  await writeFile(path.join(root, 'task-planning', 'decisions.json'), '{"schemaVersion":1,"decisions":[]}\n');
  return root;
}

function run(root, args, at = '2026-07-23T12:00:00.000Z') {
  return spawnSync('node', ['task-planning/tools/update-timestamps.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test', TASK_PLANNER_TEST_NOW: at },
  });
}

test('bootstrap registra fechas reales y hash', async () => {
  const root = await fixture();
  try {
    const result = run(root, ['bootstrap']);
    assert.equal(result.status, 0, result.stderr);
    const state = await json(path.join(root, 'task-planning', 'project-state.json'));
    const decisions = await json(path.join(root, 'task-planning', 'decisions.json'));
    assert.equal(state.timestamps.createdAt, '2026-07-23T12:00:00.000Z');
    assert.equal(state.timestamps.updatedAt, '2026-07-23T12:00:00.000Z');
    assert.match(state.timestamps.contentHash, /^sha256:[a-f0-9]{64}$/);
    assert.equal(decisions.timestamps.createdAt, '2026-07-23T12:00:00.000Z');
    assert.match(decisions.timestamps.contentHash, /^sha256:[a-f0-9]{64}$/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('touch conserva createdAt y cambia updatedAt', async () => {
  const root = await fixture();
  try {
    assert.equal(run(root, ['bootstrap']).status, 0);
    const file = path.join(root, 'task-planning', 'decisions.json');
    const data = await json(file);
    data.decisions.push({ id: 'DEC-1' });
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
    const result = run(root, ['touch', 'task-planning/decisions.json'], '2026-07-23T12:05:00.000Z');
    assert.equal(result.status, 0, result.stderr);
    const changed = await json(file);
    assert.equal(changed.timestamps.createdAt, '2026-07-23T12:00:00.000Z');
    assert.equal(changed.timestamps.updatedAt, '2026-07-23T12:05:00.000Z');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('rechaza archivos fuera del conjunto administrado', async () => {
  const root = await fixture();
  try {
    assert.equal(run(root, ['bootstrap']).status, 0);
    const result = run(root, ['touch', '../outside.json']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Archivo no administrado/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('approval-requested y approval-resolved usan el reloj', async () => {
  const root = await fixture();
  try {
    assert.equal(run(root, ['bootstrap']).status, 0);
    assert.equal(run(root, ['approval-requested', 'resolvedBlueprint'], '2026-07-23T12:10:00.000Z').status, 0);
    assert.equal(run(root, ['approval-resolved', 'resolvedBlueprint', 'approved', 'user'], '2026-07-23T12:11:00.000Z').status, 0);
    const state = await json(path.join(root, 'task-planning', 'project-state.json'));
    assert.equal(state.approvals.resolvedBlueprint.requestedAt, '2026-07-23T12:10:00.000Z');
    assert.equal(state.approvals.resolvedBlueprint.resolvedAt, '2026-07-23T12:11:00.000Z');
    assert.equal(state.approvals.resolvedBlueprint.resolvedBy, 'user');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('complete exige workflow.status completed', async () => {
  const root = await fixture();
  try {
    assert.equal(run(root, ['bootstrap']).status, 0);
    const result = run(root, ['complete']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /workflow.status=completed/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
