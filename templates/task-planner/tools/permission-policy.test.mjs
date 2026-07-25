#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(HERE, '..', '..', '..');
const AGENT = path.join(PKG_ROOT, 'opencode', 'agents', 'task-planner.md');

async function agentText() {
  return readFile(AGENT, 'utf8');
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
  assert.match(text, new RegExp(`cp -n ${VAR}\\/tools\\/update-timestamps\\.mjs \\.devflow\\/task-planner\\/tools\\/update-timestamps\\.mjs": allow`));
  assert.match(text, new RegExp(`cp -n ${VAR}\\/tools\\/build-epic-graph\\.mjs \\.devflow\\/task-planner\\/tools\\/build-epic-graph\\.mjs": allow`));
  assert.match(text, /node \.devflow\/task-planner\/tools\/build-epic-graph\.mjs": allow/);
});
