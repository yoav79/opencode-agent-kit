#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.join(HERE, 'fixtures', 'valid');
const VALIDATOR_SOURCE = path.join(HERE, 'validate-epic-batch.mjs');

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function withFixture(mutate) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'epic-batch-v1-'));
  await cp(FIXTURE_ROOT, root, { recursive: true });
  await cp(
    VALIDATOR_SOURCE,
    path.join(
      root,
      '.devflow',
      'task-planner',
      'tools',
      'validate-epic-batch.mjs',
    ),
  );
  try {
    if (mutate) await mutate(root);
    const run = spawnSync(
      'node',
      ['.devflow/task-planner/tools/validate-epic-batch.mjs', '--epic', 'EPIC-DOM-001'],
      { cwd: root, encoding: 'utf8' },
    );
    const result = JSON.parse(run.stdout || '{}');
    return { ...run, result };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function codes(result) {
  return new Set(result.result.errors.map((e) => e.code));
}

function taskCodes(result, taskId) {
  const taskErrors = result.result.errorsByTask[taskId] || [];
  return new Set(taskErrors.map((e) => e.code));
}

test('acepta épica consistente sin errores', async () => {
  const result = await withFixture();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.result.status, 'passed');
  assert.equal(result.result.epicId, 'EPIC-DOM-001');
  assert.equal(result.result.errorCount, 0);
  assert.equal(result.result.taskCount, 7);
});

test('rechaza tarea sin bloque semántico', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace(/\n## Contrato semántico[\s\S]*$/, '\n'),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-003').has('TASK_SECTION_MISSING'));
  assert(taskCodes(result, 'TASK-003').has('TASK_SEMANTIC_BLOCK_MISSING'));
});

test('rechaza backend binding ajeno', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replaceAll('mailctl domain create', 'mailctl domain delete'),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-003').has('TASK_SEMANTIC_BLOCK_MISMATCH'));
  assert(taskCodes(result, 'TASK-003').has('TASK_FOREIGN_BACKEND_BINDING'));
});

test('rechaza behaviorIds desalineados con capability', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'task-plan.json',
    );
    const data = await json(file);
    const task = data.tasks.find((t) => t.id === 'TASK-003');
    task.behaviorIds = ['BEH-WRONG'];
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-003').has('TASK_BEHAVIOR_IDS_MISMATCH'));
});

test('rechaza semanticKeys desalineados con capability', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'task-plan.json',
    );
    const data = await json(file);
    const task = data.tasks.find((t) => t.id === 'TASK-003');
    task.semanticKeys = ['wrong.key'];
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-003').has('TASK_SEMANTIC_KEYS_MISMATCH'));
});

test('rechaza requirementCoverage.behaviorIds != task.behaviorIds', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'task-plan.json',
    );
    const data = await json(file);
    const task = data.tasks.find((t) => t.id === 'TASK-003');
    task.requirementCoverage[0].behaviorIds = ['BEH-DOM-ENABLE'];
    await writeJson(file, data);
  });
  assert.equal(result.status, 1);
  assert(
    taskCodes(result, 'TASK-003').has(
      'TASK_REQUIREMENT_COVERAGE_BEHAVIOR_MISMATCH',
    ),
  );
});

test('rechaza SCOPE faltante en markdown', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace('SCOPE-003', 'SCOPE-999'),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-003').has('TASK_SCOPE_MARKDOWN_MISMATCH'));
});

test('rechaza AC faltante en markdown', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace(/AC-001/g, 'AC-999'),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(
    taskCodes(result, 'TASK-003').has('TASK_ACCEPTANCE_MARKDOWN_MISMATCH'),
  );
});

test('rechaza heading obligatorio faltante', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace(/\n## Pruebas[\s\S]*?(?=\n## )/, '\n'),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-003').has('TASK_SECTION_MISSING'));
});

test('rechaza bloque semántico con campos incorrectos', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace(
        '"behaviorIds": ["BEH-DOM-CREATE"]',
        '"behaviorIds": ["BEH-WRONG"]',
      ),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-003').has('TASK_SEMANTIC_BLOCK_MISMATCH'));
});

test('rechaza bloque semántico con markdown no canónico', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace(
        '  "backendBindings": ["mailctl domain create"]\n}',
        '  "backendBindings": ["mailctl domain create"],\n  "extra": []\n}',
      ),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(
    taskCodes(result, 'TASK-003').has(
      'TASK_SEMANTIC_BLOCK_MARKDOWN_MISMATCH',
    ),
  );
});

test('rechaza SCOPE faltante en tarea habilitante', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-001.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace('SCOPE-001', 'SIN-SCOPE'),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert(taskCodes(result, 'TASK-001').has('TASK_SCOPE_MISSING'));
});

test('no toca archivos globales', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'epic-batch-readonly-'));
  await cp(FIXTURE_ROOT, root, { recursive: true });
  await cp(
    VALIDATOR_SOURCE,
    path.join(
      root,
      '.devflow',
      'task-planner',
      'tools',
      'validate-epic-batch.mjs',
    ),
  );

  const before = {};
  const globalFiles = [
    'task-plan.json',
    'capability-map.json',
    'semantic-contract.json',
    'requirements.json',
  ];
  for (const file of globalFiles) {
    before[file] = await readFile(
      path.join(root, '.devflow', 'task-planner', file),
      'utf8',
    );
  }

  spawnSync(
    'node',
    ['.devflow/task-planner/tools/validate-epic-batch.mjs', '--epic', 'EPIC-DOM-001'],
    { cwd: root, encoding: 'utf8' },
  );

  for (const file of globalFiles) {
    const after = await readFile(
      path.join(root, '.devflow', 'task-planner', file),
      'utf8',
    );
    assert.equal(before[file], after, `${file} fue modificado`);
  }

  await rm(root, { recursive: true, force: true });
});

test('reporta errores agrupados por tarea', async () => {
  const result = await withFixture(async (root) => {
    const file = path.join(
      root,
      '.devflow',
      'task-planner',
      'tasks',
      'TASK-003.md',
    );
    const text = await readFile(file, 'utf8');
    await writeFile(
      file,
      text.replace('mailctl domain create', 'mailctl domain delete'),
      'utf8',
    );
  });
  assert.equal(result.status, 1);
  assert.ok(result.result.errorsByTask['TASK-003']);
  assert.ok(result.result.errorsByTask['TASK-003'].length > 0);
  for (const error of result.result.errorsByTask['TASK-003']) {
    assert.ok(error.code);
    assert.ok(error.message);
  }
});

test('retorna 0 y advertencia si no hay tareas para el épico', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'epic-batch-empty-'));
  await cp(FIXTURE_ROOT, root, { recursive: true });
  await cp(
    VALIDATOR_SOURCE,
    path.join(
      root,
      '.devflow',
      'task-planner',
      'tools',
      'validate-epic-batch.mjs',
    ),
  );
  try {
    const run = spawnSync(
      'node',
      [
        '.devflow/task-planner/tools/validate-epic-batch.mjs',
        '--epic',
        'EPIC-NONEXISTENT',
      ],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(run.status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
