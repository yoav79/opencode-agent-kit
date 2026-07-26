#!/usr/bin/env node

import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TOOL_VERSION = '1.0';
const ROOT = process.cwd();
const TP = path.join(ROOT, '.devflow', 'task-planner');
const DRAFTS = path.join(TP, 'drafts');
const TASKS_DIR = path.join(TP, 'tasks');
const TASK_PLAN = path.join(TP, 'task-plan.json');
const SEMANTIC_CONTRACT = path.join(TP, 'semantic-contract.json');
const CAPABILITY_MAP = path.join(TP, 'capability-map.json');
const EPIC_PLAN = path.join(TP, 'epic-plan.json');

const arr = (value) => (Array.isArray(value) ? value : []);
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function usage() {
  process.stderr.write(`Uso:
  node .devflow/task-planner/tools/render-task-markdown.mjs --task-batch <batch.json>
  node .devflow/task-planner/tools/render-task-markdown.mjs --task <TASK-ID>
  node .devflow/task-planner/tools/render-task-markdown.mjs --all
  node .devflow/task-planner/tools/render-task-markdown.mjs --task-batch <batch.json> --output-dir .devflow/task-planner/drafts
`);
}

function compareIds(a, b) {
  return String(a).localeCompare(String(b));
}

function sortedUniqueStrings(values) {
  return [...new Set(arr(values).filter((value) => typeof value === 'string' && value.trim() !== ''))].sort(compareIds);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file, label) {
  try {
    const value = JSON.parse(await readFile(file, 'utf8'));
    if (!obj(value)) throw new Error('la raíz debe ser un objeto');
    return value;
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

async function readText(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function indexById(records, label) {
  const map = new Map();
  for (const record of records) {
    if (!obj(record) || typeof record.id !== 'string' || record.id.trim() === '') {
      throw new Error(`${label} contiene un registro sin id válido`);
    }
    if (map.has(record.id)) throw new Error(`${label} contiene id duplicado: ${record.id}`);
    map.set(record.id, record);
  }
  return map;
}

function indexContracts(records) {
  const map = new Map();
  for (const contract of records) {
    if (!obj(contract) || typeof contract.behaviorId !== 'string' || contract.behaviorId.trim() === '') {
      throw new Error('semantic-contract.json contiene un contrato sin behaviorId válido');
    }
    if (map.has(contract.behaviorId)) {
      throw new Error(`semantic-contract.json contiene behaviorId duplicado: ${contract.behaviorId}`);
    }
    map.set(contract.behaviorId, contract);
  }
  return map;
}

function parseArgs(argv) {
  const args = { taskBatches: [], taskIds: [], includeAll: false, outputDir: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--all') {
      args.includeAll = true;
      continue;
    }
    if (arg === '--task-batch') {
      const batchPath = argv[index + 1];
      if (!batchPath) throw new Error('--task-batch requiere un valor');
      args.taskBatches.push(batchPath);
      index += 1;
      continue;
    }
    if (arg === '--task') {
      const taskId = argv[index + 1];
      if (!taskId) throw new Error('--task requiere un valor');
      args.taskIds.push(taskId);
      index += 1;
      continue;
    }
    if (arg === '--output-dir') {
      const outputDir = argv[index + 1];
      if (!outputDir) throw new Error('--output-dir requiere un valor');
      args.outputDir = outputDir;
      index += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    }
    throw new Error(`Argumento desconocido: ${arg}`);
  }

  return args;
}

async function resolveTaskSkeletons(args) {
  if (args.includeAll) {
    const taskPlan = await readJson(TASK_PLAN, 'task-plan.json');
    const tasks = arr(taskPlan.tasks);
    const capabilityMap = indexById(
      (await readJson(CAPABILITY_MAP, 'capability-map.json')).capabilities ?? [],
      'capability-map.capabilities',
    );

    const skeletons = [];
    for (const task of tasks) {
      const capabilityId = arr(task.createsCapabilityIds)[0];
      const capability = capabilityId ? capabilityMap.get(capabilityId) : null;
      if (!capability) throw new Error(`Capacidad ${capabilityId} no encontrada para ${task.id}`);

      const contracts = await readJson(SEMANTIC_CONTRACT, 'semantic-contract.json');
      const contractMap = indexContracts(arr(contracts.contracts));

      skeletons.push(buildSkeleton(task, capability, contractMap));
    }
    return skeletons;
  }

  if (args.taskIds.length > 0) {
    const taskPlan = await readJson(TASK_PLAN, 'task-plan.json');
    const taskMap = indexById(arr(taskPlan.tasks), 'task-plan.tasks');
    const capabilityMap = indexById(
      (await readJson(CAPABILITY_MAP, 'capability-map.json')).capabilities ?? [],
      'capability-map.capabilities',
    );
    const contracts = await readJson(SEMANTIC_CONTRACT, 'semantic-contract.json');
    const contractMap = indexContracts(arr(contracts.contracts));

    const skeletons = [];
    for (const taskId of args.taskIds) {
      const task = taskMap.get(taskId);
      if (!task) throw new Error(`Tarea no encontrada: ${taskId}`);

      const capabilityId = arr(task.createsCapabilityIds)[0];
      const capability = capabilityId ? capabilityMap.get(capabilityId) : null;
      if (!capability) throw new Error(`Capacidad ${capabilityId} no encontrada para ${taskId}`);

      skeletons.push(buildSkeleton(task, capability, contractMap));
    }
    return skeletons;
  }

  if (args.taskBatches.length > 0) {
    const skeletons = [];
    for (const batchPath of args.taskBatches) {
      const resolved = path.resolve(batchPath);
      const batch = await readJson(resolved, path.basename(batchPath));
      const batchSkeletons = arr(batch.taskSkeletons);

      for (const skeleton of batchSkeletons) {
        skeletons.push(skeleton);
      }
    }
    return skeletons;
  }

  throw new Error('Falta --task, --task-batch o --all');
}

function buildSkeleton(task, capability, contractMap) {
  const behaviorIds = sortedUniqueStrings(task.behaviorIds ?? capability.behaviorIds);
  const contracts = behaviorIds.map((behaviorId) => {
    const contract = contractMap.get(behaviorId);
    if (!contract) throw new Error(`Falta contrato semántico para ${behaviorId}`);
    return contract;
  });

  const sourceFunctionIds = sortedUniqueStrings(contracts.map((c) => c.sourceFunctionId));
  const backendBindings = sortedUniqueStrings(contracts.map((c) => c.backendBinding));

  const scopeItemIds = arr(task.requirementCoverage).flatMap((cov) => arr(cov.scopeItemIds));
  const acceptanceCriterionIds = arr(task.requirementCoverage).flatMap((cov) => arr(cov.acceptanceCriterionIds));

  return {
    task,
    capability,
    contracts,
    behaviorIds,
    sourceFunctionIds,
    backendBindings,
    scopeItemIds,
    acceptanceCriterionIds,
  };
}

function buildTitle(task) {
  return `# ${task.id} \u2014 ${task.title}\n`;
}

function buildObjetivo(task, capability, contracts) {
  const lines = [];
  lines.push('## Objetivo\n');

  if (task.type === 'functional' && contracts.length > 0) {
    const binding = contracts[0].backendBinding;
    const capabilityName = capability.name.charAt(0).toLowerCase() + capability.name.slice(1);
    lines.push(`Implementar la funcionalidad de ${capabilityName} en la WebUI, invocando \`${binding}\` y mostrando el resultado sin modificación.`);
  } else {
    lines.push(capability.result);
  }

  lines.push('');
  return lines.join('\n');
}

function buildCapacidadesCreadas(task) {
  const lines = [];
  lines.push('## Capacidades creadas\n');

  const created = sortedUniqueStrings(task.createsCapabilityIds);
  if (created.length === 0) {
    lines.push('- Ninguna.');
  } else {
    for (const capId of created) {
      lines.push(`- ${capId}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function buildCapacidadesConsumidas(task) {
  const lines = [];
  lines.push('## Capacidades consumidas\n');

  const consumed = sortedUniqueStrings(task.consumesCapabilityIds);
  if (consumed.length === 0) {
    lines.push('- Ninguna.');
  } else {
    for (const capId of consumed) {
      lines.push(`- ${capId}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function buildAlcance(task, capAllCaps, epicCaps) {
  const lines = [];
  lines.push('## Alcance\n');

  const coverage = arr(task.requirementCoverage);

  if (task.type === 'functional' && coverage.length > 0) {
    for (const cov of coverage) {
      const scopeItemIds = arr(cov.scopeItemIds);
      for (const scopeId of scopeItemIds) {
        lines.push(`- ${scopeId}: Implementar únicamente el resultado descrito por el contrato semántico.`);
      }
    }
  } else if (task.type === 'enabling') {
    const scopeIds = sortedUniqueStrings(
      arr(task.requirementCoverage).flatMap((cov) => arr(cov.scopeItemIds)),
    );
    if (scopeIds.length > 0) {
      for (const scopeId of scopeIds) {
        lines.push(`- ${scopeId}: Implementar la capacidad habilitante ${arr(task.createsCapabilityIds)[0] || ''}.`);
      }
    } else {
      const firstCap = arr(task.createsCapabilityIds)[0];
      const scopeId = firstCap ? `SCOPE-${firstCap.replace(/^CAP-/, '')}` : 'SCOPE-TASK';
      lines.push(`- ${scopeId}: Implementar la capacidad ${firstCap || 'base'}.`);
    }
  } else {
    const firstCap = arr(task.createsCapabilityIds)[0];
    const scopeId = firstCap ? `SCOPE-${firstCap.replace(/^CAP-/, '')}` : 'SCOPE-TASK';
    lines.push(`- ${scopeId}: Implementar la capacidad ${firstCap || ''}.`);
  }

  lines.push('');
  return lines.join('\n');
}

function extractActionFromSemanticKey(semanticKey) {
  if (typeof semanticKey !== 'string') return '';
  const parts = semanticKey.split('.');
  return parts.length >= 2 ? parts[parts.length - 1] : semanticKey;
}

function findPeerFunctionalCapsInEpic(task, capabilityMap) {
  const epicId = task.epicId;
  const myCapId = arr(task.createsCapabilityIds)[0];

  const peers = [];
  for (const cap of capabilityMap.values()) {
    if (cap.ownerEpicId !== epicId) continue;
    if (cap.id === myCapId) continue;
    if (cap.type === 'functional' && cap.implementationKind === 'planned') {
      peers.push(cap);
    }
  }
  return peers;
}

function buildFueraDeAlcance(task, contracts, capabilityMap) {
  const lines = [];
  lines.push('## Fuera de alcance\n');

  if (task.type === 'functional') {
    const myBehaviorIds = sortedUniqueStrings(task.behaviorIds);

    const peerCaps = findPeerFunctionalCapsInEpic(task, capabilityMap);
    const peerSemanticKeys = peerCaps.flatMap((cap) => arr(cap.semanticKeys));
    const mySemanticKeys = sortedUniqueStrings(task.semanticKeys);

    const otherActions = sortedUniqueStrings(peerSemanticKeys)
      .filter((key) => !mySemanticKeys.includes(key))
      .map(extractActionFromSemanticKey)
      .filter(Boolean);

    if (otherActions.length > 0) {
      lines.push(`- Cualquier behavior, operación o política no incluida en el contrato semántico (${otherActions.join(', ')}).`);
    } else {
      lines.push('- Cualquier behavior, operación o política no incluida en el contrato semántico.');
    }
  } else {
    const peerCaps = findPeerFunctionalCapsInEpic(task, capabilityMap);
    const peerActions = sortedUniqueStrings(
      peerCaps.flatMap((cap) => arr(cap.semanticKeys)).map(extractActionFromSemanticKey),
    ).filter(Boolean);

    if (peerActions.length > 0) {
      lines.push(`- Cualquier funcionalidad específica de dominios (${peerActions.join(', ')}).`);
    } else {
      lines.push('- Cualquier behavior, operación o política no incluida en el contrato semántico.');
    }
  }

  lines.push('');
  return lines.join('\n');
}

function buildCriteriosAceptacion(task) {
  const lines = [];
  lines.push('## Criterios de aceptación\n');

  const coverage = arr(task.requirementCoverage);
  const allAcIds = sortedUniqueStrings(coverage.flatMap((cov) => arr(cov.acceptanceCriterionIds)));

  if (task.type === 'functional') {
    if (allAcIds.length > 0) {
      for (let i = 0; i < allAcIds.length; i += 1) {
        lines.push(`- ${allAcIds[i]}: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.`);
      }
      lines.push(`- ${allAcIds[allAcIds.length - 1]}: Un fallo de la operación no se reporta como éxito.`);
    } else {
      lines.push('- AC-001: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.');
      lines.push('- AC-002: Un fallo de la operación no se reporta como éxito.');
    }
  } else {
    for (let i = 0; i < allAcIds.length; i += 1) {
      lines.push(`- ${allAcIds[i]}: El resultado esperado de la capacidad se verifica correctamente.`);
    }
    if (allAcIds.length === 0) {
      const firstCap = arr(task.createsCapabilityIds)[0];
      const acId = firstCap ? `AC-${firstCap.replace(/^CAP-/, '')}` : 'AC-TASK';
      lines.push(`- ${acId}: La capacidad se implementa correctamente.`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function buildPruebas(task, contracts) {
  const lines = [];
  lines.push('## Pruebas\n');

  if (task.type === 'functional' && contracts.length > 0) {
    const contract = contracts[0];
    const operation = contract.operation || contract.semanticKey || '';
    const words = operation.replace(/_/g, ' ').trim();

    lines.push(`- Caso exitoso del behavior principal: ejecutar ${words} y verificar que la WebUI muestra el resultado producido por el backend.`);
    lines.push('- Caso de error relevante: ejecutar la operación con datos inválidos y verificar que el error se reporta correctamente.');
  } else {
    lines.push('- Caso exitoso del behavior principal.');
    lines.push('- Caso de error relevante.');
  }

  lines.push('');
  return lines.join('\n');
}

function buildContratoSemantico(task, contracts) {
  const lines = [];
  lines.push('## Contrato semántico\n');

  const behaviorIds = sortedUniqueStrings(contracts.map((c) => c.behaviorId));
  const semanticKeys = sortedUniqueStrings(contracts.map((c) => c.semanticKey));
  const sourceFunctionIds = sortedUniqueStrings(contracts.map((c) => c.sourceFunctionId));
  const backendBindings = sortedUniqueStrings(contracts.map((c) => c.backendBinding));

  const block = {
    behaviorIds,
    semanticKeys,
    sourceFunctionIds,
    backendBindings,
  };

  lines.push('```json');
  lines.push(JSON.stringify(block, null, 2));
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function markdownContains(markdown, text) {
  return markdown.includes(text);
}

function filterForeignBackendBindings(markdown, taskBehaviorIds, allContracts) {
  const foreignBindings = allContracts
    .filter((contract) => !taskBehaviorIds.includes(contract.behaviorId))
    .map((contract) => contract.backendBinding)
    .filter((binding) => typeof binding === 'string' && binding.trim() !== '');

  for (const binding of foreignBindings) {
    if (markdownContains(markdown, binding)) {
      throw new Error(
        `El markdown contiene un backendBinding ajeno: ${JSON.stringify(binding)}. ` +
        `Los behaviors de esta tarea son: ${JSON.stringify(taskBehaviorIds)}.`,
      );
    }
  }
}

function assembleMarkdown(task, capability, contracts, allContracts, capabilityMap) {
  const sections = [
    buildTitle(task),
    buildObjetivo(task, capability, contracts),
    buildCapacidadesCreadas(task),
    buildCapacidadesConsumidas(task),
    buildAlcance(task, capabilityMap, null),
    buildFueraDeAlcance(task, contracts, capabilityMap),
    buildCriteriosAceptacion(task),
    buildPruebas(task, contracts),
    buildContratoSemantico(task, contracts),
  ];

  const markdown = sections.join('\n');

  const taskBehaviorIds = sortedUniqueStrings(task.behaviorIds);
  filterForeignBackendBindings(markdown, taskBehaviorIds, allContracts);

  return markdown;
}

function validateSchemaVersions(taskPlan, semanticContract, capabilityMap) {
  if (taskPlan.schemaVersion !== 4) {
    throw new Error(`task-plan.json schemaVersion debe ser 4, recibió ${JSON.stringify(taskPlan.schemaVersion)}`);
  }
  if (semanticContract.schemaVersion !== 1) {
    throw new Error(`semantic-contract.json schemaVersion debe ser 1, recibió ${JSON.stringify(semanticContract.schemaVersion)}`);
  }
  if (capabilityMap.schemaVersion !== 3) {
    throw new Error(`capability-map.json schemaVersion debe ser 3, recibió ${JSON.stringify(capabilityMap.schemaVersion)}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.taskBatches.length && !args.taskIds.length && !args.includeAll) {
    usage();
    process.exit(2);
  }

  const taskPlan = await readJson(TASK_PLAN, 'task-plan.json');
  const semanticContract = await readJson(SEMANTIC_CONTRACT, 'semantic-contract.json');
  const capabilityPlan = await readJson(CAPABILITY_MAP, 'capability-map.json');

  validateSchemaVersions(taskPlan, semanticContract, capabilityPlan);

  const allContracts = arr(semanticContract.contracts);
  const contractMap = indexContracts(allContracts);
  const capabilities = arr(capabilityPlan.capabilities).filter(
    (cap) => obj(cap) && cap.implementationKind === 'planned',
  );
  const capabilityMap = indexById(capabilities, 'capability-map.capabilities');

  const skeletons = await resolveTaskSkeletons(args);

  const resolvedOutputDir = path.resolve(args.outputDir || TASKS_DIR);
  await mkdir(resolvedOutputDir, { recursive: true });

  const results = [];

  for (const skeleton of skeletons) {
    const task = skeleton.task;
    if (!obj(task) || typeof task.id !== 'string') {
      throw new Error('Skeleton contiene un task sin id válido');
    }

    const capabilityId = arr(task.createsCapabilityIds)[0];
    const capability = capabilityId ? capabilityMap.get(capabilityId) : null;
    if (!capability) {
      throw new Error(`Capacidad no encontrada para ${task.id}: ${capabilityId}`);
    }

    const behaviorIds = sortedUniqueStrings(task.behaviorIds);
    const contracts = behaviorIds.map((behaviorId) => {
      const contract = contractMap.get(behaviorId);
      if (!contract && task.type === 'functional') {
        throw new Error(`Falta contrato semántico para ${behaviorId} (${task.id})`);
      }
      return contract;
    }).filter(Boolean);

    const markdown = assembleMarkdown(task, capability, contracts, allContracts, capabilityMap);

    const normalizedFile = args.outputDir
      ? path.join(args.outputDir, `${task.id}.md`).split(path.sep).join('/')
      : task.file || `.devflow/task-planner/tasks/${task.id}.md`;
    const absoluteFile = path.resolve(normalizedFile);
    await writeFile(absoluteFile, markdown, 'utf8');

    results.push({
      taskId: task.id,
      file: normalizedFile,
      status: 'rendered',
    });
  }

  process.stdout.write(`${JSON.stringify({
    tool: 'render-task-markdown.mjs',
    version: TOOL_VERSION,
    renderedCount: results.length,
    results,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Render task markdown failed: ${error.message}\n`);
  process.exitCode = 1;
});
