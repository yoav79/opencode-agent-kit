#!/usr/bin/env node

import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

const ASSEMBLER_VERSION = '1.0';

const ROOT = process.cwd();
const TP = path.join(ROOT, '.devflow', 'task-planner');

const P = {
  semantic: path.join(TP, 'semantic-contract.json'),
  capabilities: path.join(TP, 'capability-map.json'),
  proposal: path.join(TP, 'capability-map.proposal.json'),
  state: path.join(TP, 'project-state.json'),
  timestampUpdater: path.join(TP, 'tools', 'update-timestamps.mjs'),
};

const rel = (filePath) =>
  path.relative(ROOT, filePath).split(path.sep).join('/');

const arr = (value) => (Array.isArray(value) ? value : []);

const obj = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, label) {
  if (!(await exists(filePath))) {
    throw new Error(`${label}: ${rel(filePath)} no existe.`);
  }

  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    if (!obj(parsed)) {
      throw new Error(`${label}: la raíz debe ser un objeto.`);
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`${label}: ${rel(filePath)} no existe.`);
    }
    throw new Error(`${label}: ${error.message}`);
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (obj(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function digest(document) {
  const clone = structuredClone(document);
  if (obj(clone.timestamps)) {
    delete clone.timestamps.contentHash;
  }
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical(clone))).digest('hex')}`;
}

function nowISO() {
  return new Date().toISOString();
}

const ALLOWED_TYPES = new Set([
  'functional',
  'enabling',
  'non_functional',
  'external',
]);

const ALLOWED_KINDS = new Set([
  'planned',
  'preexisting',
  'external',
]);

function indexByBehaviorId(contracts) {
  const map = new Map();

  for (const [index, contract] of contracts.entries()) {
    if (!obj(contract) || typeof contract.behaviorId !== 'string' || contract.behaviorId.trim() === '') {
      throw new Error(`semantic-contract.contracts[${index}] no tiene behaviorId válido.`);
    }

    if (map.has(contract.behaviorId)) {
      throw new Error(`${contract.behaviorId} está duplicado en semantic-contract.json.`);
    }

    map.set(contract.behaviorId, contract);
  }

  return map;
}

function assembleCapability(proposed, contract) {
  const base = structuredClone(proposed);
  const isFunctional = base.type === 'functional';

  if (isFunctional && contract) {
    base.behaviorIds = [contract.behaviorId];
    base.semanticKeys = [contract.semanticKey];
    base.result = contract.outcome;

    const reqIds = new Set(arr(base.requirementIds));
    reqIds.add(contract.requirementId);
    base.requirementIds = [...reqIds].sort();
  } else if (!isFunctional) {
    base.behaviorIds = [];
    base.semanticKeys = [];
  }

  return base;
}

function validateProposed(proposed, index, contract) {
  const issues = [];

  if (!obj(proposed)) {
    issues.push({
      code: 'PROPOSED_CAPABILITY_INVALID',
      message: `proposed[${index}] debe ser un objeto.`,
    });
    return issues;
  }

  if (typeof proposed.id !== 'string' || proposed.id.trim() === '') {
    issues.push({
      code: 'PROPOSED_CAPABILITY_ID_MISSING',
      message: `proposed[${index}] no tiene id válido.`,
    });
    return issues;
  }

  if (typeof proposed.name !== 'string' || proposed.name.trim() === '') {
    issues.push({
      code: 'PROPOSED_CAPABILITY_NAME_MISSING',
      message: `${proposed.id} no tiene name.`,
    });
  }

  if (!ALLOWED_TYPES.has(proposed.type)) {
    issues.push({
      code: 'PROPOSED_CAPABILITY_TYPE_INVALID',
      message: `${proposed.id} tiene type=${JSON.stringify(proposed.type)}; permitido: ${[...ALLOWED_TYPES].join(', ')}.`,
    });
  }

  if (!ALLOWED_KINDS.has(proposed.implementationKind)) {
    issues.push({
      code: 'PROPOSED_CAPABILITY_KIND_INVALID',
      message: `${proposed.id} tiene implementationKind=${JSON.stringify(proposed.implementationKind)}; permitido: ${[...ALLOWED_KINDS].join(', ')}.`,
    });
  }

  if (typeof proposed.logicalOwner !== 'string' || proposed.logicalOwner.trim() === '') {
    issues.push({
      code: 'PROPOSED_CAPABILITY_LOGICAL_OWNER_MISSING',
      message: `${proposed.id} no tiene logicalOwner.`,
    });
  }

  if (proposed.type === 'functional' && !contract) {
    issues.push({
      code: 'PROPOSED_FUNCTIONAL_WITHOUT_CONTRACT',
      message: `${proposed.id} es functional pero no se encontró un contrato semántico correspondiente. Asigna un behaviorId válido que exista en semantic-contract.json.`,
    });
  }

  if (!Array.isArray(proposed.requiredCapabilityIds)) {
    issues.push({
      code: 'PROPOSED_CAPABILITY_REQUIRED_IDS_INVALID',
      message: `${proposed.id}.requiredCapabilityIds debe ser un arreglo.`,
    });
  }

  if (!Array.isArray(proposed.consumerCapabilityIds)) {
    issues.push({
      code: 'PROPOSED_CAPABILITY_CONSUMER_IDS_INVALID',
      message: `${proposed.id}.consumerCapabilityIds debe ser un arreglo.`,
    });
  }

  return issues;
}

function validateCrossReferences(capabilities) {
  const issues = [];
  const ids = new Set(capabilities.map((c) => c.id));

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;

    for (const requiredId of arr(capability.requiredCapabilityIds)) {
      if (!ids.has(requiredId)) {
        issues.push({
          code: 'ASSEMBLED_REQUIRED_CAPABILITY_UNKNOWN',
          message: `${capability.id} requiere ${requiredId}, pero no existe en el mapa.`,
        });
        continue;
      }

      const required = capabilities.find((c) => c.id === requiredId);
      if (required && !arr(required.consumerCapabilityIds).includes(capability.id)) {
        issues.push({
          code: 'ASSEMBLED_CONSUMER_REFERENCE_MISSING',
          message: `${capability.id} declara ${requiredId} en requiredCapabilityIds, pero ${requiredId} no lo registra en consumerCapabilityIds.`,
        });
      }
    }

    for (const consumerId of arr(capability.consumerCapabilityIds)) {
      if (!ids.has(consumerId)) {
        issues.push({
          code: 'ASSEMBLED_CONSUMER_UNKNOWN',
          message: `${capability.id} declara ${consumerId} en consumerCapabilityIds, pero no existe en el mapa.`,
        });
        continue;
      }

      const consumer = capabilities.find((c) => c.id === consumerId);
      if (consumer && !arr(consumer.requiredCapabilityIds).includes(capability.id)) {
        issues.push({
          code: 'ASSEMBLED_REQUIRED_REFERENCE_MISSING',
          message: `${capability.id} es consumidor declarado de ${consumerId} en consumerCapabilityIds, pero ${consumerId} no lo declara en requiredCapabilityIds.`,
        });
      }
    }
  }

  return issues;
}

function validateFunctionalOneToOne(capabilities) {
  const issues = [];
  const functionalByBehavior = new Map();

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;

    if (capability.type !== 'functional') continue;

    const behaviorIds = arr(capability.behaviorIds);

    if (behaviorIds.length !== 1) {
      issues.push({
        code: 'ASSEMBLED_FUNCTIONAL_BEHAVIOR_COUNT_INVALID',
        message: `${capability.id} es functional pero declara ${behaviorIds.length} behaviorIds; debe ser exactamente 1.`,
      });
      continue;
    }

    const behaviorId = behaviorIds[0];
    const semanticKeys = arr(capability.semanticKeys);

    if (semanticKeys.length !== 1) {
      issues.push({
        code: 'ASSEMBLED_FUNCTIONAL_SEMANTIC_KEY_COUNT_INVALID',
        message: `${capability.id} es functional pero declara ${semanticKeys.length} semanticKeys; debe ser exactamente 1.`,
      });
    }

    if (functionalByBehavior.has(behaviorId)) {
      issues.push({
        code: 'ASSEMBLED_BEHAVIOR_MULTIPLE_CAPABILITIES',
        message: `${behaviorId} es implementado por ${functionalByBehavior.get(behaviorId)} y ${capability.id}. Una capacidad funcional representa un solo behavior.`,
      });
    } else {
      functionalByBehavior.set(behaviorId, capability.id);
    }
  }

  return issues;
}

function validateNonFunctionalCleared(capabilities) {
  const issues = [];

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;

    if (capability.type === 'functional') continue;

    if (arr(capability.behaviorIds).length > 0) {
      issues.push({
        code: 'ASSEMBLED_NON_FUNCTIONAL_HAS_BEHAVIORS',
        message: `${capability.id} es ${capability.type} pero declara behaviorIds; deben estar vacíos.`,
      });
    }

    if (arr(capability.semanticKeys).length > 0) {
      issues.push({
        code: 'ASSEMBLED_NON_FUNCTIONAL_HAS_SEMANTIC_KEYS',
        message: `${capability.id} es ${capability.type} pero declara semanticKeys; deben estar vacíos.`,
      });
    }
  }

  return issues;
}

function detectCycles(capabilities) {
  const issues = [];
  const ids = new Set(capabilities.filter(obj).map((c) => c.id));

  const graph = new Map();

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;
    const dependencies = arr(capability.requiredCapabilityIds).filter((id) => ids.has(id));
    graph.set(capability.id, dependencies);

    if (dependencies.includes(capability.id)) {
      issues.push({
        code: 'ASSEMBLED_SELF_DEPENDENCY',
        message: `${capability.id} se requiere a sí misma.`,
      });
    }
  }

  const state = new Map();
  const stack = [];
  const reported = new Set();

  function visit(id) {
    const currentState = state.get(id) ?? 0;

    if (currentState === 2) return;

    if (currentState === 1) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id].join(' -> ');

      if (!reported.has(cycle)) {
        reported.add(cycle);
        issues.push({
          code: 'ASSEMBLED_DEPENDENCY_CYCLE',
          message: `Ciclo de dependencia detectado entre capacidades: ${cycle}.`,
        });
      }
      return;
    }

    state.set(id, 1);
    stack.push(id);

    for (const dependency of graph.get(id) ?? []) {
      visit(dependency);
    }

    stack.pop();
    state.set(id, 2);
  }

  for (const id of graph.keys()) {
    visit(id);
  }

  return issues;
}

async function main() {
  const semantic = await readJson(P.semantic, 'semantic-contract.json');

  if (![1].includes(semantic.schemaVersion)) {
    throw new Error(`semantic-contract.json schemaVersion debe ser 1, recibió ${JSON.stringify(semantic.schemaVersion)}`);
  }

  const contracts = arr(semantic.contracts);
  const contractMap = indexByBehaviorId(contracts);

  let proposal;

  if (await exists(P.proposal)) {
    proposal = await readJson(P.proposal, 'capability-map.proposal.json');
  } else if (await exists(P.capabilities)) {
    proposal = await readJson(P.capabilities, 'capability-map.json');
  } else {
    throw new Error(`No se encontró ${rel(P.proposal)} ni ${rel(P.capabilities)}.`);
  }

  const proposed = arr(proposal.capabilities ?? proposal.proposed ?? []);

  if (proposed.length === 0) {
    throw new Error('No hay capacidades propuestas para ensamblar.');
  }

  const issues = [];

  const assembled = [];

  for (const [index, item] of proposed.entries()) {
    if (!obj(item)) continue;

    let contract = null;
    const behaviorIds = arr(item.behaviorIds);

    if (item.type === 'functional') {
      if (behaviorIds.length === 1) {
        contract = contractMap.get(behaviorIds[0]);
      }
    }

    const propIssues = validateProposed(item, index, contract);
    issues.push(...propIssues);

    if (propIssues.length > 0 && item.type === 'functional' && !contract) {
      continue;
    }

    const normalized = assembleCapability(item, contract);
    assembled.push(normalized);
  }

  const crossRefIssues = validateCrossReferences(assembled);
  issues.push(...crossRefIssues);

  const funcIssues = validateFunctionalOneToOne(assembled);
  issues.push(...funcIssues);

  const nonFuncIssues = validateNonFunctionalCleared(assembled);
  issues.push(...nonFuncIssues);

  const cycleIssues = detectCycles(assembled);
  issues.push(...cycleIssues);

  if (issues.length > 0) {
    process.stdout.write('Advertencias de ensamblaje:\n');
    for (const issue of issues) {
      process.stdout.write(`  - ${issue.code}: ${issue.message}\n`);
    }
  }

  const existing = (await exists(P.capabilities))
    ? await readJson(P.capabilities, 'capability-map.json')
    : null;

  const created = existing?.timestamps?.createdAt || nowISO();

  const document = {
    schemaVersion: 3,
    status: existing?.status || 'generated',
    capabilities: assembled,
    timestamps: {
      createdAt: created,
      updatedAt: nowISO(),
      contentHash: null,
    },
  };

  document.timestamps.contentHash = digest(document);

  await writeJson(P.capabilities, document);

  const result = {
    version: ASSEMBLER_VERSION,
    assembled: assembled.length,
    issues: issues.length,
    issuesByCode: issues.reduce((acc, issue) => {
      acc[issue.code] = (acc[issue.code] ?? 0) + 1;
      return acc;
    }, {}),
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Capability map assembly failed: ${error.message}\n`);
  process.exitCode = 1;
});
