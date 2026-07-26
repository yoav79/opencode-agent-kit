#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const frontmatterRe = /^---\n(.*?)\n---\n/s;

function parseFrontmatter(text) {
  const match = frontmatterRe.exec(text);
  if (!match) return { frontmatter: '', body: text };
  return { frontmatter: match[1], body: text.slice(match[0].length) };
}

function getEditSection(frontmatter) {
  const editMatch = /^  edit:\n((?:    .*\n?)*)/m.exec(frontmatter);
  return editMatch ? editMatch[1] : null;
}

test('context-builder: mode debe ser subagent', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'agents', 'context-builder.md'), 'utf8');
  const { frontmatter } = parseFrontmatter(text);
  assert.ok(frontmatter, 'frontmatter must exist');
  const modeLine = frontmatter.split('\n').find((l) => l.startsWith('mode:'));
  assert.ok(modeLine, 'mode field must exist');
  assert.ok(modeLine.includes('subagent'), 'mode must be subagent');
});

test('context-builder: no debe tener permiso edit para execution-state.json', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'agents', 'context-builder.md'), 'utf8');
  const { frontmatter } = parseFrontmatter(text);
  assert.ok(!/execution-state\.json/.test(frontmatter), 'Must not reference execution-state.json');
});

test('context-builder: no debe tener permiso edit para ningún selection.json', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'agents', 'context-builder.md'), 'utf8');
  const { frontmatter } = parseFrontmatter(text);
  const editSection = getEditSection(frontmatter);
  assert.ok(editSection, 'edit section must exist');
  assert.ok(!/selection\.json/.test(editSection), 'Must not edit any selection.json');
});

test('context-builder: no debe tener permiso mkdir', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'agents', 'context-builder.md'), 'utf8');
  const { frontmatter } = parseFrontmatter(text);
  assert.ok(!/^  bash:.*\n.*mkdir/m.test(frontmatter), 'Must not have mkdir in bash permissions');
});

test('context-builder: solo debe editar execution-context.json y execution-prompt.md', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'agents', 'context-builder.md'), 'utf8');
  const { frontmatter } = parseFrontmatter(text);
  const editSection = getEditSection(frontmatter);
  assert.ok(editSection, 'edit section must exist');
  const allowPatterns = editSection.split('\n')
    .map((l) => l.match(/"(.*)":\s*allow/))
    .filter(Boolean)
    .map((m) => m[1]);
  for (const val of allowPatterns) {
    if (!val.includes('execution-context.json') && !val.includes('execution-prompt.md')) {
      assert.ok(false, `Unauthorized edit allow pattern: ${val}`);
    }
  }
});

test('context-builder: cuerpo debe declarar que es subagente', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'agents', 'context-builder.md'), 'utf8');
  const { body } = parseFrontmatter(text);
  const lower = body.toLowerCase();
  assert.ok(lower.includes('subagente') || lower.slice(0, 200).includes('subagente'),
    'Body must declare it is a subagent');
});

test('build-next-task-context: no debe contener instrucciones para ejecutar prepare-task-run', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'commands', 'build-next-task-context.md'), 'utf8');
  const { body } = parseFrontmatter(text);
  const execRefs = body.match(
    /(?:execute|run|exec|simulate|invoke|delegate\s+to)\s+(?:`[^`]*)?prepare\-task\-run/gi,
  );
  if (execRefs) {
    assert.equal(execRefs.length, 0, `Must not reference prepare-task-run as an executable: ${execRefs.join(', ')}`);
  }
});

test('build-next-task-context: no debe referenciar prepare-task-run.mjs', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'opencode', 'commands', 'build-next-task-context.md'), 'utf8');
  const { body } = parseFrontmatter(text);
  assert.ok(!/prepare-task-run\.mjs/.test(body), 'Must not reference prepare-task-run.mjs');
});
