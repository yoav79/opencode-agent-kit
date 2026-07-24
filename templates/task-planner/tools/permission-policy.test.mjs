#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const AGENT = path.join(HERE, '..', '..', 'agents', 'task-planner.md');

// When installed globally the test is under templates/tools and the agent is not
// a sibling. Package tests use the fallback package-relative path.
async function agentText() {
  try {
    return await readFile(AGENT, 'utf8');
  } catch {
    const packageAgent = path.join(HERE, '..', '..', '..', 'agents', 'task-planner.md');
    return readFile(packageAgent, 'utf8');
  }
}

test('bash queda deny por defecto y cp genérico requiere aprobación', async () => {
  const text = await agentText();
  assert.match(text, /bash:\n\s+"\*": deny/);
  assert.match(text, /"cp \*": ask/);
  assert.doesNotMatch(text, /"cp \*": allow/);
});

test('solo las copias cp -n de plantillas conocidas quedan permitidas', async () => {
  const text = await agentText();
  assert.match(text, /cp -n \/home\/yoab\/\.config\/opencode\/task-planner\/templates\/project-state\.json \.devflow\/task-planner\/project-state\.json": allow/);
  assert.match(text, /cp -n \/home\/yoab\/\.config\/opencode\/task-planner\/templates\/tools\/update-timestamps\.mjs \.devflow\/task-planner\/tools\/update-timestamps\.mjs": allow/);
  assert.match(text, /cp -n \/home\/yoab\/\.config\/opencode\/task-planner\/templates\/tools\/build-epic-graph\.mjs \.devflow\/task-planner\/tools\/build-epic-graph\.mjs": allow/);
  assert.match(text, /node \.devflow\/task-planner\/tools\/build-epic-graph\.mjs": allow/);
});
