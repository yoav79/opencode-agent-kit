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
const ASSEMBLE_SOURCE = path.join(HERE, 'assemble-capability-map.mjs');
const VALIDATE_SOURCE = path.join(HERE, 'validate-capability-map.mjs');

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function withFixture(mutate) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'capability-map-tools-'));
  await cp(FIXTURE_ROOT, root, { recursive: true });
  await cp(ASSEMBLE_SOURCE, path.join(root, '.devflow', 'task-planner', 'tools', 'assemble-capability-map.mjs'));
  await cp(VALIDATE_SOURCE, path.join(root, '.devflow', 'task-planner', 'tools', 'validate-capability-map.mjs'));
  try {
    if (mutate) await mutate(root);
    return root;
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}

test('assemble-capability-map congela la semántica canónica desde la propuesta', async () => {
  const root = await withFixture(async (fixtureRoot) => {
    const file = path.join(fixtureRoot, '.devflow', 'task-planner', 'capability-map.proposal.json');
    await writeJson(file, {
      proposed: [
        {
          id: 'CAP-DOM-CREATE',
          name: 'Crear dominio',
          result: 'texto libre incorrecto',
          type: 'functional',
          implementationKind: 'planned',
          requirementIds: [],
          behaviorIds: ['BEH-DOM-CREATE'],
          semanticKeys: ['wrong.key'],
          decisionIds: [],
          logicalOwner: 'domains',
          ownerEpicId: null,
          ownerTaskId: null,
          requiredCapabilityIds: ['CAP-API-LAYER'],
          consumerCapabilityIds: [],
          incrementId: 'INC-DOM',
          confirmationStatus: 'confirmed'
        },
        {
          id: 'CAP-API-LAYER',
          name: 'API layer',
          result: 'Exponer una capa base de API.',
          type: 'enabling',
          implementationKind: 'planned',
          requirementIds: [],
          behaviorIds: ['BEH-DOM-CREATE'],
          semanticKeys: ['dom.create'],
          decisionIds: [],
          logicalOwner: 'platform',
          ownerEpicId: null,
          ownerTaskId: null,
          requiredCapabilityIds: [],
          consumerCapabilityIds: ['CAP-DOM-CREATE'],
          incrementId: 'INC-DOM',
          confirmationStatus: 'confirmed'
        }
      ]
    });
  });

  try {
    const run = spawnSync('node', ['.devflow/task-planner/tools/assemble-capability-map.mjs'], {
      cwd: root,
      encoding: 'utf8'
    });
    assert.equal(run.status, 0, run.stderr);

    const map = await json(path.join(root, '.devflow', 'task-planner', 'capability-map.json'));
    const functional = map.capabilities.find((capability) => capability.id === 'CAP-DOM-CREATE');
    const enabling = map.capabilities.find((capability) => capability.id === 'CAP-API-LAYER');

    assert.deepEqual(functional.behaviorIds, ['BEH-DOM-CREATE']);
    assert.deepEqual(functional.semanticKeys, ['dom.create']);
    assert.equal(functional.result, 'El backend confirma la creación del dominio solicitado y la WebUI muestra el resultado sin modificarlo.');
    assert.deepEqual(functional.requirementIds, ['REQ-DOM-001']);
    assert.deepEqual(enabling.behaviorIds, []);
    assert.deepEqual(enabling.semanticKeys, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('validate-capability-map detecta mismatches semánticos canónicos', async () => {
  const root = await withFixture(async (fixtureRoot) => {
    const file = path.join(fixtureRoot, '.devflow', 'task-planner', 'capability-map.json');
    const document = await json(file);
    const capability = document.capabilities.find((item) => item.id === 'CAP-DOM-CREATE');
    capability.semanticKeys = ['wrong.key'];
    capability.result = 'resultado incorrecto';
    await writeJson(file, document);
  });

  try {
    const run = spawnSync('node', ['.devflow/task-planner/tools/validate-capability-map.mjs'], {
      cwd: root,
      encoding: 'utf8'
    });
    assert.equal(run.status, 1);

    const report = JSON.parse(run.stdout.split('\nCapability map válido.')[0]);
    const codes = new Set(report.errors.map((error) => error.code));
    assert(codes.has('CAPABILITY_SEMANTIC_KEY_MISMATCH'));
    assert(codes.has('CAPABILITY_OUTCOME_MISMATCH'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
