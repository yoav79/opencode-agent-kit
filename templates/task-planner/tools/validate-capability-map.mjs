#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const VALIDATOR_VERSION = '1.0';

const ROOT = process.cwd();
const TP = path.join(ROOT, '.devflow', 'task-planner');

const P = {
  semantic: path.join(TP, 'semantic-contract.json'),
  capabilities: path.join(TP, 'capability-map.json'),
};

const rel = (filePath) =>
  path.relative(ROOT, filePath).split(path.sep).join('/');

const arr = (value) => (Array.isArray(value) ? value : []);

const obj = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

const errors = [];
const warnings = [];

function addError(code, message, file = null, reference = null) {
  errors.push({ code, message, file, reference });
}

function addWarning(code, message, file = null, reference = null) {
  warnings.push({ code, message, file, reference });
}

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
    addError('FILE_MISSING', `Falta ${rel(filePath)}.`, rel(filePath));
    return null;
  }

  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    if (!obj(parsed)) {
      addError('JSON_ROOT_INVALID', `${label} debe tener un objeto en la raíz.`, rel(filePath));
      return null;
    }
    return parsed;
  } catch (error) {
    addError('JSON_INVALID', `${label} no contiene JSON válido: ${error.message}`, rel(filePath));
    return null;
  }
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function sortedUniqueStrings(values) {
  return [...new Set(arr(values).filter((value) => typeof value === 'string'))].sort();
}

function sameStringSet(left, right) {
  return JSON.stringify(sortedUniqueStrings(left)) === JSON.stringify(sortedUniqueStrings(right));
}

const ALLOWED_TYPES = new Set(['functional', 'enabling', 'non_functional', 'external']);

const ALLOWED_KINDS = new Set(['planned', 'preexisting', 'external']);

const ALLOWED_STATUSES = new Set(['initialized', 'generated', 'validated']);

function validateSchemaAndStatus(document, pathKey) {
  if (!document) return;

  if (document.schemaVersion !== 3) {
    addError(
      'CAPABILITY_MAP_SCHEMA_VERSION_INVALID',
      `capability-map.json debe usar schemaVersion=3, recibió ${JSON.stringify(document.schemaVersion)}.`,
      rel(P.capabilities),
    );
  }

  if (!ALLOWED_STATUSES.has(document.status)) {
    addError(
      'CAPABILITY_MAP_STATUS_INVALID',
      `capability-map.json.status=${JSON.stringify(document.status)}; permitido: ${[...ALLOWED_STATUSES].join(', ')}.`,
      rel(P.capabilities),
      'status',
    );
  }
}

function indexContracts(contracts) {
  const map = new Map();

  for (const [index, contract] of contracts.entries()) {
    if (!obj(contract)) {
      addError('SEMANTIC_CONTRACT_ITEM_INVALID', `contracts[${index}] debe ser un objeto.`, rel(P.semantic), String(index));
      continue;
    }

    if (typeof contract.behaviorId !== 'string' || contract.behaviorId.trim() === '') {
      addError('SEMANTIC_CONTRACT_BEHAVIOR_ID_MISSING', `contracts[${index}] no tiene behaviorId.`, rel(P.semantic), String(index));
      continue;
    }

    if (map.has(contract.behaviorId)) {
      addError('SEMANTIC_CONTRACT_BEHAVIOR_DUPLICATED', `${contract.behaviorId} aparece más de una vez en semantic-contract.json.`, rel(P.semantic), contract.behaviorId);
      continue;
    }

    for (const field of ['behaviorId', 'semanticKey', 'requirementId', 'outcome']) {
      if (typeof contract[field] !== 'string' || contract[field].trim() === '') {
        addError('SEMANTIC_CONTRACT_FIELD_MISSING', `contracts[${index}].${field} no tiene valor válido.`, rel(P.semantic), contract.behaviorId ?? String(index));
      }
    }

    map.set(contract.behaviorId, contract);
  }

  return map;
}

function indexCapabilities(capabilities) {
  const map = new Map();

  for (const [index, capability] of capabilities.entries()) {
    if (!obj(capability)) {
      addError('CAPABILITY_ITEM_INVALID', `capabilities[${index}] debe ser un objeto.`, rel(P.capabilities), String(index));
      continue;
    }

    if (typeof capability.id !== 'string' || capability.id.trim() === '') {
      addError('CAPABILITY_ID_MISSING', `capabilities[${index}] no tiene id válido.`, rel(P.capabilities), String(index));
      continue;
    }

    if (map.has(capability.id)) {
      addError('CAPABILITY_ID_DUPLICATED', `${capability.id} está duplicado en capability-map.json.`, rel(P.capabilities), capability.id);
      continue;
    }

    map.set(capability.id, capability);
  }

  return map;
}

function validateCapabilityFields(capability, contractMap) {
  const id = capability.id;

  if (typeof capability.name !== 'string' || capability.name.trim() === '') {
    addError('CAPABILITY_NAME_MISSING', `${id} no tiene name.`, rel(P.capabilities), id);
  }

  if (!ALLOWED_TYPES.has(capability.type)) {
    addError('CAPABILITY_TYPE_INVALID', `${id} tiene type=${JSON.stringify(capability.type)}; permitido: ${[...ALLOWED_TYPES].join(', ')}.`, rel(P.capabilities), id);
  }

  if (!ALLOWED_KINDS.has(capability.implementationKind)) {
    addError('CAPABILITY_KIND_INVALID', `${id} tiene implementationKind=${JSON.stringify(capability.implementationKind)}; permitido: ${[...ALLOWED_KINDS].join(', ')}.`, rel(P.capabilities), id);
  }

  if (typeof capability.logicalOwner !== 'string' || capability.logicalOwner.trim() === '') {
    addError('CAPABILITY_LOGICAL_OWNER_MISSING', `${id} no tiene logicalOwner.`, rel(P.capabilities), id);
  } else if (capability.logicalOwner === id) {
    addError('CAPABILITY_SELF_OWNED', `${id} usa su propio ID como logicalOwner.`, rel(P.capabilities), id);
  }

  if (/\bcrud\b|gesti[oó]n completa|administraci[oó]n completa/i.test(`${capability.name ?? ''} ${capability.result ?? ''}`)) {
    addError('CAPABILITY_TOO_BROAD', `${id} parece agrupar comportamientos separables.`, rel(P.capabilities), id);
  }

  if (Array.isArray(capability.decisionIds)) {
    for (const duplicate of duplicateValues(capability.decisionIds)) {
      addError('CAPABILITY_DECISION_DUPLICATED', `${id} repite ${duplicate} en decisionIds.`, rel(P.capabilities), id);
    }
  }

  if (capability.implementationKind === 'planned') {
    if (typeof capability.ownerEpicId !== 'string' || capability.ownerEpicId.trim() === '') {
      addWarning('CAPABILITY_OWNER_EPIC_ABSENT', `${id} es planned pero no tiene ownerEpicId (se espera que lo establezca epic_generation).`, rel(P.capabilities), id);
    }

    if (typeof capability.ownerTaskId !== 'string' || capability.ownerTaskId.trim() === '') {
      addWarning('CAPABILITY_OWNER_TASK_ABSENT', `${id} es planned pero no tiene ownerTaskId (se espera que lo establezca epic_decomposition).`, rel(P.capabilities), id);
    }
  }

  if (!Array.isArray(capability.requiredCapabilityIds)) {
    addError('CAPABILITY_REQUIRED_IDS_MISSING', `${id}.requiredCapabilityIds debe ser un arreglo.`, rel(P.capabilities), id);
  }

  if (!Array.isArray(capability.consumerCapabilityIds)) {
    addError('CAPABILITY_CONSUMER_IDS_MISSING', `${id}.consumerCapabilityIds debe ser un arreglo.`, rel(P.capabilities), id);
  }

  if (arr(capability.requiredCapabilityIds).includes(id)) {
    addError('CAPABILITY_SELF_DEPENDENCY', `${id} se requiere a sí misma.`, rel(P.capabilities), id);
  }
}

function validateFunctionalCapabilitySemantics(capability, contractMap, capabilityMap) {
  const id = capability.id;

  if (capability.type !== 'functional') {
    if (arr(capability.behaviorIds).length > 0) {
      addError('NON_FUNCTIONAL_HAS_BEHAVIORS', `${id} es ${capability.type} pero declara behaviorIds; deben estar vacíos.`, rel(P.capabilities), id);
    }
    if (arr(capability.semanticKeys).length > 0) {
      addError('NON_FUNCTIONAL_HAS_SEMANTIC_KEYS', `${id} es ${capability.type} pero declara semanticKeys; deben estar vacíos.`, rel(P.capabilities), id);
    }
    return;
  }

  const declaredBehaviorIds = arr(capability.behaviorIds);
  const declaredSemanticKeys = arr(capability.semanticKeys);

  if (declaredBehaviorIds.length !== 1) {
    addError(
      'FUNCTIONAL_CAPABILITY_BEHAVIOR_COUNT_INVALID',
      `${id} es functional y debe declarar exactamente 1 behaviorId; recibió ${declaredBehaviorIds.length}.`,
      rel(P.capabilities),
      id,
    );
  }

  if (declaredSemanticKeys.length !== 1) {
    addError(
      'FUNCTIONAL_CAPABILITY_SEMANTIC_KEY_COUNT_INVALID',
      `${id} es functional y debe declarar exactamente 1 semanticKey; recibió ${declaredSemanticKeys.length}.`,
      rel(P.capabilities),
      id,
    );
  }

  if (declaredBehaviorIds.length === 0) return;

  const behaviorId = declaredBehaviorIds[0];
  const contract = contractMap.get(behaviorId);

  if (!contract) {
    addError(
      'CAPABILITY_BEHAVIOR_WITHOUT_CONTRACT',
      `${id} referencia ${behaviorId}, que no tiene contrato en semantic-contract.json.`,
      rel(P.capabilities),
      id,
    );
    return;
  }

  if (capability.semanticKeys[0] !== contract.semanticKey) {
    addError(
      'CAPABILITY_SEMANTIC_KEY_MISMATCH',
      `${id} declara semanticKey=${JSON.stringify(capability.semanticKeys[0])}, pero ${behaviorId} exige ${JSON.stringify(contract.semanticKey)}.`,
      rel(P.capabilities),
      id,
    );
  }

  if (capability.result !== contract.outcome) {
    addError(
      'CAPABILITY_OUTCOME_MISMATCH',
      `${id}.result=${JSON.stringify(capability.result)}, pero ${behaviorId} exige ${JSON.stringify(contract.outcome)}.`,
      rel(P.capabilities),
      id,
    );
  }

  if (!arr(capability.requirementIds).includes(contract.requirementId)) {
    addError(
      'CAPABILITY_REQUIREMENT_SEMANTIC_MISMATCH',
      `${id} implementa ${behaviorId} que pertenece a ${contract.requirementId}, pero requirementIds no incluye ${contract.requirementId}.`,
      rel(P.capabilities),
      id,
    );
  }
}

function validateBehaviorUniquenessAcrossCapabilities(capabilities) {
  const functionalByBehavior = new Map();

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;
    if (capability.type !== 'functional') continue;

    const behaviorIds = arr(capability.behaviorIds);
    if (behaviorIds.length !== 1) continue;

    const behaviorId = behaviorIds[0];
    const owners = functionalByBehavior.get(behaviorId) ?? [];
    owners.push(capability.id);
    functionalByBehavior.set(behaviorId, owners);
  }

  for (const [behaviorId, owners] of functionalByBehavior.entries()) {
    if (owners.length > 1) {
      addError(
        'BEHAVIOR_MULTIPLE_FUNCTIONAL_CAPABILITIES',
        `${behaviorId} es implementado por varias capacidades funcionales: ${owners.sort().join(', ')}.`,
        rel(P.capabilities),
        behaviorId,
      );
    }
  }
}

function validateCrossReferences(capabilities, capabilityMap) {
  const capabilityIds = new Set(capabilityMap.keys());

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;
    const id = capability.id;

    for (const requiredId of arr(capability.requiredCapabilityIds)) {
      if (typeof requiredId !== 'string' || requiredId.trim() === '') {
        addError('CAPABILITY_REQUIRED_ID_INVALID', `${id} tiene una referencia vacía en requiredCapabilityIds.`, rel(P.capabilities), id);
        continue;
      }

      if (!capabilityIds.has(requiredId)) {
        addError('CAPABILITY_REQUIRED_UNKNOWN', `${id} requiere ${requiredId}, que no existe en el mapa.`, rel(P.capabilities), id);
        continue;
      }

      const required = capabilityMap.get(requiredId);
      if (required && !arr(required.consumerCapabilityIds).includes(id)) {
        addError(
          'CAPABILITY_CONSUMER_REFERENCE_MISSING',
          `${id} declara requerir ${requiredId}, pero ${requiredId} no lo registra en consumerCapabilityIds.`,
          rel(P.capabilities),
          id,
        );
      }
    }

    for (const consumerId of arr(capability.consumerCapabilityIds)) {
      if (typeof consumerId !== 'string' || consumerId.trim() === '') {
        addError('CAPABILITY_CONSUMER_ID_INVALID', `${id} tiene una referencia vacía en consumerCapabilityIds.`, rel(P.capabilities), id);
        continue;
      }

      if (!capabilityIds.has(consumerId)) {
        addError('CAPABILITY_CONSUMER_UNKNOWN', `${id} declara consumidor ${consumerId}, que no existe en el mapa.`, rel(P.capabilities), id);
        continue;
      }

      const consumer = capabilityMap.get(consumerId);
      if (consumer && !arr(consumer.requiredCapabilityIds).includes(id)) {
        addError(
          'CAPABILITY_REQUIRED_REFERENCE_MISSING',
          `${id} es consumidor declarado de ${consumerId}, pero ${consumerId} no lo declara en requiredCapabilityIds.`,
          rel(P.capabilities),
          id,
        );
      }
    }
  }
}

function detectCycles(capabilities) {
  const ids = new Set(capabilities.filter(obj).map((c) => c.id).filter((id) => typeof id === 'string'));

  const graph = new Map();

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;
    const dependencies = arr(capability.requiredCapabilityIds).filter((id) => ids.has(id));
    graph.set(capability.id, dependencies);
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
        addError(
          'CAPABILITY_DEPENDENCY_CYCLE',
          `Ciclo de dependencia entre capacidades: ${cycle}.`,
          rel(P.capabilities),
          id,
        );
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
}

function summarizeReport() {
  const codes = {};
  for (const error of errors) {
    codes[error.code] = (codes[error.code] ?? 0) + 1;
  }
  return codes;
}

async function main() {
  const semantic = await readJson(P.semantic, 'semantic-contract.json');
  const capabilitiesDocument = await readJson(P.capabilities, 'capability-map.json');

  validateSchemaAndStatus(capabilitiesDocument, P.capabilities);

  const contracts = arr(semantic?.contracts ?? []);
  const capabilities = arr(capabilitiesDocument?.capabilities ?? []);

  const contractMap = indexContracts(contracts);
  const capabilityMap = indexCapabilities(capabilities);

  const capabilityIds = new Set(capabilityMap.keys());

  for (const requiredId of arr(capabilitiesDocument?.capabilities ?? []).flatMap((c) => arr(c?.requiredCapabilityIds))) {
    if (typeof requiredId === 'string' && requiredId.trim() !== '' && !capabilityIds.has(requiredId)) {
      addError(
        'CAPABILITY_REQUIRED_UNKNOWN',
        `requiredCapabilityIds referencia ${requiredId}, que no existe en el mapa.`,
        rel(P.capabilities),
        requiredId,
      );
    }
  }

  for (const consumerId of arr(capabilitiesDocument?.capabilities ?? []).flatMap((c) => arr(c?.consumerCapabilityIds))) {
    if (typeof consumerId === 'string' && consumerId.trim() !== '' && !capabilityIds.has(consumerId)) {
      addError(
        'CAPABILITY_CONSUMER_UNKNOWN',
        `consumerCapabilityIds referencia ${consumerId}, que no existe en el mapa.`,
        rel(P.capabilities),
        consumerId,
      );
    }
  }

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') continue;
    validateCapabilityFields(capability, contractMap);
    validateFunctionalCapabilitySemantics(capability, contractMap, capabilityMap);
  }

  validateBehaviorUniquenessAcrossCapabilities(capabilities);
  validateCrossReferences(capabilities, capabilityMap);
  detectCycles(capabilities);

  const summary = summarizeReport();

  const report = {
    validator: {
      name: 'validate-capability-map.mjs',
      version: VALIDATOR_VERSION,
    },
    summary: {
      capabilityCount: capabilities.length,
      functionalCount: capabilities.filter((c) => c?.type === 'functional').length,
      nonFunctionalCount: capabilities.filter((c) => c?.type !== 'functional').length,
      plannedCount: capabilities.filter((c) => c?.implementationKind === 'planned').length,
      errors: errors.length,
      warnings: warnings.length,
      errorCodes: summary,
      cyclesDetected: errors.filter((e) => e.code === 'CAPABILITY_DEPENDENCY_CYCLE').length,
    },
    errors,
    warnings,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

  if (errors.length > 0) {
    process.stderr.write(`Capability map inválido: ${errors.length} error(es), ${warnings.length} advertencia(s).\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('Capability map válido.\n');
  }
}

main().catch((error) => {
  process.stderr.write(`Error fatal: ${error.message}\n`);
  process.exitCode = 2;
});
