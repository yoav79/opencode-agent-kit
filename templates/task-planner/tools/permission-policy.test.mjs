#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(HERE, '..', '..', '..');
const AGENT = path.join(PKG_ROOT, 'opencode', 'agents', 'task-planner.md');
const SUBAGENT = path.join(PKG_ROOT, 'opencode', 'agents', 'epic-decomposer.md');

async function agentText() {
  return readFile(AGENT, 'utf8');
}

async function subagentText() {
  return readFile(SUBAGENT, 'utf8');
}

test('bash queda deny por defecto y cp genérico requiere aprobación', async () => {
  const text = await agentText();
  assert.match(text, /bash:\n\s+"\*": deny/);
  assert.match(text, /"cp \*": ask/);
  assert.doesNotMatch(text, /"cp \*": allow/);
});

test('edit no queda globalmente abierto; solo permite .devflow/task-planner/**', async () => {
  const text = await agentText();
  assert.doesNotMatch(text, /edit: allow/);
  assert.match(text, /edit:\n\s+"\*": deny\n\s+".devflow\/task-planner\/\*\*": allow/);
});

test('solo las copias cp -n de plantillas conocidas quedan permitidas', async () => {
  const text = await agentText();
  const VAR = String.raw`\$\{XDG_CONFIG_HOME:-\$HOME\/\.config\}\/opencode\/templates\/task-planner`;
  assert.match(text, new RegExp(`cp -n ${VAR}\\/project-state\\.json \\.devflow\\/task-planner\\/project-state\\.json": allow`));
  assert.match(text, new RegExp(`cp -n ${VAR}\\/tools\\/assemble-epic-task-batch\\.mjs \\.devflow\\/task-planner\\/tools\\/assemble-epic-task-batch\\.mjs": allow`));
  assert.match(text, new RegExp(`cp -n ${VAR}\\/tools\\/reserve-task-ids\\.mjs \\.devflow\\/task-planner\\/tools\\/reserve-task-ids\\.mjs": allow`));
  assert.match(text, new RegExp(`cp -n ${VAR}\\/tools\\/update-timestamps\\.mjs \\.devflow\\/task-planner\\/tools\\/update-timestamps\\.mjs": allow`));
  assert.match(text, new RegExp(`cp -n ${VAR}\\/tools\\/build-epic-graph\\.mjs \\.devflow\\/task-planner\\/tools\\/build-epic-graph\\.mjs": allow`));
  assert.match(text, /node \.devflow\/task-planner\/tools\/build-epic-graph\.mjs": allow/);
});

test('task-planner tiene task: allow para invocar subagentes', async () => {
  const text = await agentText();
  assert.match(text, /task: allow/);
  assert.doesNotMatch(text, /task: deny/);
});

test('epic-decomposer es mode: subagent', async () => {
  const text = await subagentText();
  assert.match(text, /^mode: subagent$/m);
});

test('epic-decomposer solo edita drafts/** y no índices globales', async () => {
  const text = await subagentText();
  assert.match(text, /".devflow\/task-planner\/drafts\/\*\*": allow/);
  assert.match(text, /"\*": deny/);
  assert.doesNotMatch(text, /task-plan\.json.*allow/);
  assert.doesNotMatch(text, /epic-plan\.json.*allow/);
  assert.doesNotMatch(text, /capability-map\.json.*allow/);
  assert.doesNotMatch(text, /project-state\.json.*allow/);
});

test('epic-decomposer tiene task: deny (no puede crear sub-subagentes)', async () => {
  const text = await subagentText();
  assert.match(text, /task: deny/);
});
