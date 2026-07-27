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

test('el agente ya no tiene cp -n de plantillas (delegado al instalador central)', async () => {
  const text = await agentText();
  const VAR = String.raw`\$\{XDG_CONFIG_HOME:-\$HOME\/\.config\}\/opencode\/templates\/task-planner`;
  assert.doesNotMatch(text, new RegExp(`cp -n ${VAR}\/project-state\.json`));
  assert.doesNotMatch(text, new RegExp(`cp -n ${VAR}\/tools\/`));
  assert.match(text, /"cp \*": ask/);
});

test('task-planner permite ejecutar las tools semánticas oficiales', async () => {
  const text = await agentText();
  assert.match(text, /node \.devflow\/task-planner\/tools\/assemble-capability-map\.mjs": allow/);
  assert.match(text, /node \.devflow\/task-planner\/tools\/assemble-capability-map\.mjs \*": allow/);
  assert.match(text, /node \.devflow\/task-planner\/tools\/validate-capability-map\.mjs": allow/);
  assert.match(text, /node \.devflow\/task-planner\/tools\/validate-capability-map\.mjs \*": allow/);
  assert.match(text, /node \.devflow\/task-planner\/tools\/render-task-markdown\.mjs": allow/);
  assert.match(text, /node \.devflow\/task-planner\/tools\/render-task-markdown\.mjs \*": allow/);
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

test('task-planner puede leer contratos de epic-decomposer via external_directory', async () => {
  const text = await agentText();
  assert.match(text, /external_directory[\s\S]*contracts\/\*/);
  assert.match(text, /"\$HOME\/\.config\/opencode\/templates\/task-planner\/contracts\/\*": allow/);
  assert.match(text, /"\$XDG_CONFIG_HOME\/opencode\/templates\/task-planner\/contracts\/\*": allow/);
  assert.match(text, /"\$\{XDG_CONFIG_HOME:-\$HOME\/\.config\}\/opencode\/templates\/task-planner\/contracts\/\*": allow/);
});
