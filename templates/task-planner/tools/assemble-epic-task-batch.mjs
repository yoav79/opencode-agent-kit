#!/usr/bin/env node

import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TOOL_VERSION = '1.0';
const ROOT = process.cwd();
const TP = path.join(ROOT, '.devflow', 'task-planner');
const DRAFTS = path.join(TP, 'drafts');
const EPIC_FILE = path.join(TP, 'epic-plan.json');
const CAPABILITY_FILE = path.join(TP, 'capability-map.json');
const TASK_FILE = path.join(TP, 'task-plan.json');
const SEMANTIC_FILE = path.join(TP, 'semantic-contract.json');
const REQUIREMENTS_FILE = path.join(TP, 'requirements.json');

const arr = (value) => (Array.isArray(value) ? value : []);
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function usage() {
  process.stderr.write(`Uso:\n  node .devflow/task-planner/tools/assemble-epic-task-batch.mjs --epic EPIC-001\n  node .devflow/task-planner/tools/assemble-epic-task-batch.mjs --all\n`);
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

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function compareIds(a, b) {
  return String(a).localeCompare(String(b));
}

function sortedUniqueStrings(values) {
  return [...new Set(arr(values).filter((value) => typeof value === 'string' && value.trim() !== ''))].sort(compareIds);
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
  const epicIds = [];
  let includeAll = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--all') {
      includeAll = true;
      continue;
    }
    if (arg === '--epic') {
      const epicId = argv[index + 1];
      if (!epicId) throw new Error('--epic requiere un valor');
      epicIds.push(epicId);
      index += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    }
    throw new Error(`Argumento desconocido: ${arg}`);
  }

  return {
    includeAll,
    epicIds: sortedUniqueStrings(epicIds),
  };
}

async function readReservationDrafts() {
  if (!(await exists(DRAFTS))) {
    throw new Error('Falta .devflow/task-planner/drafts/. Ejecuta reserve-task-ids.mjs primero.');
  }

  const drafts = new Map();
  for (const entry of await readdir(DRAFTS, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.task-ids.json')) continue;
    const file = path.join(DRAFTS, entry.name);
    const reservation = await readJson(file, entry.name);
    if (typeof reservation.epicId !== 'string' || reservation.epicId.trim() === '') {
      throw new Error(`${entry.name} no contiene epicId válido`);
    }
    const capabilityTaskMap = obj(reservation.capabilityTaskMap) ? reservation.capabilityTaskMap : {};
    drafts.set(reservation.epicId, {
      epicId: reservation.epicId,
      file,
      createdTaskIds: sortedUniqueStrings(reservation.createdTaskIds),
      capabilityTaskMap: Object.fromEntries(
        Object.entries(capabilityTaskMap)
          .filter(([capabilityId, taskId]) => typeof capabilityId === 'string' && typeof taskId === 'string')
          .sort(([, leftTaskId], [, rightTaskId]) => compareIds(leftTaskId, rightTaskId)),
      ),
    });
  }
  return drafts;
}

function structuredArtifactId(prefix, taskId, ordinal) {
  const match = /^TASK-(\d+)$/.exec(String(taskId));
  const base = match ? match[1] : String(taskId).replace(/[^A-Z0-9]/gi, '-');
  if (ordinal === 1) return `${prefix}-${base}`;
  return `${prefix}-${base}-${String(ordinal).padStart(2, '0')}`;
}

function normalizeEpicTargets(epics, requestedEpicIds, includeAll) {
  const epicMap = indexById(epics, 'epic-plan.epics');
  if (requestedEpicIds.length > 0) {
    for (const epicId of requestedEpicIds) {
      if (!epicMap.has(epicId)) throw new Error(`La épica no existe: ${epicId}`);
    }
    return requestedEpicIds;
  }
  const pending = epics.filter((epic) => epic.decomposed !== true).map((epic) => epic.id);
  if (pending.length > 0 || !includeAll) return pending;
  return epics.map((epic) => epic.id);
}

function invertConsumers(capabilities) {
  const providers = new Map();
  for (const capability of capabilities) {
    providers.set(capability.id, new Set(sortedUniqueStrings(capability.requiredCapabilityIds)));
  }
  for (const capability of capabilities) {
    for (const consumerId of sortedUniqueStrings(capability.consumerCapabilityIds)) {
      const consumerProviders = providers.get(consumerId) ?? new Set();
      consumerProviders.add(capability.id);
      providers.set(consumerId, consumerProviders);
    }
  }
  return providers;
}

function summarizeTypes(tasks) {
  const summary = {
    totalTasks: tasks.length,
    functionalTasks: 0,
    enablingTasks: 0,
    nonFunctionalTasks: 0,
    externalTasks: 0,
  };
  for (const task of tasks) {
    if (task.type === 'functional') summary.functionalTasks += 1;
    else if (task.type === 'enabling') summary.enablingTasks += 1;
    else if (task.type === 'non_functional') summary.nonFunctionalTasks += 1;
    else if (task.type === 'external') summary.externalTasks += 1;
  }
  return summary;
}

async function main() {
  const { epicIds: requestedEpicIds, includeAll } = parseArgs(process.argv.slice(2));
  const epicPlan = await readJson(EPIC_FILE, 'epic-plan.json');
  const capabilityPlan = await readJson(CAPABILITY_FILE, 'capability-map.json');
  const taskPlan = await readJson(TASK_FILE, 'task-plan.json');
  const semanticContract = await readJson(SEMANTIC_FILE, 'semantic-contract.json');
  const requirements = await readJson(REQUIREMENTS_FILE, 'requirements.json');
  const reservationDrafts = await readReservationDrafts();

  if (epicPlan.schemaVersion !== 4) {
    throw new Error(`epic-plan.json schemaVersion debe ser 4, recibió ${JSON.stringify(epicPlan.schemaVersion)}`);
  }
  if (capabilityPlan.schemaVersion !== 3) {
    throw new Error(`capability-map.json schemaVersion debe ser 3, recibió ${JSON.stringify(capabilityPlan.schemaVersion)}`);
  }
  if (taskPlan.schemaVersion !== 4) {
    throw new Error(`task-plan.json schemaVersion debe ser 4, recibió ${JSON.stringify(taskPlan.schemaVersion)}`);
  }
  if (semanticContract.schemaVersion !== 1) {
    throw new Error(`semantic-contract.json schemaVersion debe ser 1, recibió ${JSON.stringify(semanticContract.schemaVersion)}`);
  }
  if (semanticContract.status !== 'approved') {
    throw new Error(`semantic-contract.json debe estar approved, recibió ${JSON.stringify(semanticContract.status)}`);
  }
  if (requirements.schemaVersion !== 3) {
    throw new Error(`requirements.json schemaVersion debe ser 3, recibió ${JSON.stringify(requirements.schemaVersion)}`);
  }

  const epics = arr(epicPlan.epics);
  const capabilities = arr(capabilityPlan.capabilities).filter(
    (capability) => obj(capability) && capability.implementationKind === 'planned',
  );
  const tasks = arr(taskPlan.tasks);
  const contracts = arr(semanticContract.contracts);
  const requirementRecords = arr(requirements.requirements);

  const epicMap = indexById(epics, 'epic-plan.epics');
  const capabilityMap = indexById(capabilities, 'capability-map.capabilities');
  indexById(tasks, 'task-plan.tasks');
  const contractMap = indexContracts(contracts);
  const requirementMap = indexById(requirementRecords, 'requirements.json.requirements');

  const targetEpicIds = normalizeEpicTargets(epics, requestedEpicIds, includeAll);
  const capabilityToTask = new Map();

  for (const capability of capabilities) {
    if (typeof capability.ownerTaskId === 'string' && capability.ownerTaskId.trim() !== '') {
      capabilityToTask.set(capability.id, capability.ownerTaskId);
    }
  }
  for (const task of tasks) {
    for (const capabilityId of sortedUniqueStrings(task.createsCapabilityIds)) {
      if (!capabilityToTask.has(capabilityId)) capabilityToTask.set(capabilityId, task.id);
    }
  }
  for (const reservation of reservationDrafts.values()) {
    for (const [capabilityId, taskId] of Object.entries(reservation.capabilityTaskMap)) {
      capabilityToTask.set(capabilityId, taskId);
    }
  }

  const providerIdsByCapability = invertConsumers(capabilities);
  const results = [];

  await mkdir(DRAFTS, { recursive: true });

  for (const epicId of targetEpicIds) {
    const epic = epicMap.get(epicId);
    if (epic.decomposed === true) {
      throw new Error(`La épica ${epicId} ya está marcada como decomposed=true`);
    }

    const reservation = reservationDrafts.get(epicId);
    if (!reservation) {
      throw new Error(`Falta .devflow/task-planner/drafts/${epicId}.task-ids.json. Ejecuta reserve-task-ids.mjs primero.`);
    }

    const ownedCapabilities = capabilities.filter((capability) => capability.ownerEpicId === epicId);
    if (ownedCapabilities.length === 0) {
      throw new Error(`La épica ${epicId} no tiene capacidades planned asignadas`);
    }

    const taskSkeletons = [];

    for (const [capabilityId, taskId] of Object.entries(reservation.capabilityTaskMap).sort(([, leftTaskId], [, rightTaskId]) => compareIds(leftTaskId, rightTaskId))) {
      const capability = capabilityMap.get(capabilityId);
      if (!capability) throw new Error(`La capacidad ${capabilityId} no existe en capability-map.json`);
      if (capability.ownerEpicId !== epicId) {
        throw new Error(`La capacidad ${capabilityId} no pertenece a la épica ${epicId}`);
      }

      const behaviorIds = sortedUniqueStrings(capability.behaviorIds);
      const semanticKeys = sortedUniqueStrings(capability.semanticKeys);
      const contractsForTask = behaviorIds.map((behaviorId) => {
        const contract = contractMap.get(behaviorId);
        if (!contract) throw new Error(`Falta contrato semántico para ${behaviorId}`);
        return contract;
      });

      if (capability.type === 'functional' && behaviorIds.length === 0) {
        throw new Error(`La capacidad funcional ${capability.id} no declara behaviorIds`);
      }

      const requiredCapabilityIds = new Set(sortedUniqueStrings(capability.requiredCapabilityIds));
      for (const providerId of providerIdsByCapability.get(capability.id) ?? []) {
        requiredCapabilityIds.add(providerId);
      }

      const consumesCapabilityIds = [...requiredCapabilityIds].sort(compareIds);
      const dependencyIds = consumesCapabilityIds
        .map((requiredCapabilityId) => {
          const providerTaskId = capabilityToTask.get(requiredCapabilityId);
          if (!providerTaskId) {
            throw new Error(`No existe TASK reservado o persistido para la capacidad requerida ${requiredCapabilityId}`);
          }
          return providerTaskId;
        })
        .filter((dependencyTaskId) => dependencyTaskId !== taskId)
        .sort(compareIds);

      const coverageByRequirement = new Map();
      for (const contract of contractsForTask) {
        const requirementId = contract.requirementId;
        if (!requirementMap.has(requirementId)) {
          throw new Error(`El requirementId ${requirementId} del behavior ${contract.behaviorId} no existe en requirements.json`);
        }
        const entry = coverageByRequirement.get(requirementId) ?? [];
        entry.push(contract.behaviorId);
        coverageByRequirement.set(requirementId, entry);
      }

      const requirementCoverage = [...coverageByRequirement.entries()]
        .sort(([leftId], [rightId]) => compareIds(leftId, rightId))
        .map(([requirementId, coveredBehaviorIds], index) => ({
          requirementId,
          behaviorIds: sortedUniqueStrings(coveredBehaviorIds),
          scopeItemIds: [structuredArtifactId('SCOPE', taskId, index + 1)],
          acceptanceCriterionIds: [structuredArtifactId('AC', taskId, index + 1)],
        }));

      const scopeItemIds = requirementCoverage.flatMap((coverage) => coverage.scopeItemIds);
      const acceptanceCriterionIds = requirementCoverage.flatMap((coverage) => coverage.acceptanceCriterionIds);
      const sourceFunctionIds = sortedUniqueStrings(contractsForTask.map((contract) => contract.sourceFunctionId));
      const backendBindings = sortedUniqueStrings(contractsForTask.map((contract) => contract.backendBinding));

      const task = {
        id: taskId,
        title: capability.name,
        file: `.devflow/task-planner/tasks/${taskId}.md`,
        epicId,
        type: capability.type,
        dependencyIds: sortedUniqueStrings(dependencyIds),
        createsCapabilityIds: [capability.id],
        consumesCapabilityIds,
        behaviorIds,
        semanticKeys,
        requirementCoverage,
      };

      taskSkeletons.push({
        taskId,
        capabilityId: capability.id,
        task,
        sourceFunctionIds,
        backendBindings,
        scopeItemIds,
        acceptanceCriterionIds,
      });
    }

    const partial = {
      tasks: taskSkeletons.map((skeleton) => skeleton.task),
    };
    const batch = {
      schemaVersion: 1,
      status: 'assembled',
      epicId,
      createdTaskIds: taskSkeletons.map((skeleton) => skeleton.taskId),
      capabilityAssignments: Object.fromEntries(taskSkeletons.map((skeleton) => [skeleton.capabilityId, skeleton.taskId])),
      taskSkeletons,
    };

    const partialPath = path.join(DRAFTS, `${epicId}.task-plan.partial.json`);
    const batchPath = path.join(DRAFTS, `${epicId}.task-batch.json`);
    await writeJson(partialPath, partial);
    await writeJson(batchPath, batch);

    results.push({
      epicId,
      batchPath: `.devflow/task-planner/drafts/${epicId}.task-batch.json`,
      partialPath: `.devflow/task-planner/drafts/${epicId}.task-plan.partial.json`,
      createdTaskIds: batch.createdTaskIds,
      summary: summarizeTypes(partial.tasks),
    });
  }

  process.stdout.write(`${JSON.stringify({
    tool: 'assemble-epic-task-batch.mjs',
    version: TOOL_VERSION,
    epicCount: results.length,
    results,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Epic task batch assembly failed: ${error.message}\n`);
  process.exitCode = 1;
});
