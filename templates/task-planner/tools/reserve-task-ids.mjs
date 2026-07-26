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

const arr = (value) => (Array.isArray(value) ? value : []);
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function usage() {
  process.stderr.write(`Uso:\n  node .devflow/task-planner/tools/reserve-task-ids.mjs\n  node .devflow/task-planner/tools/reserve-task-ids.mjs --all\n  node .devflow/task-planner/tools/reserve-task-ids.mjs --epic EPIC-001 [--epic EPIC-002]\n`);
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

function compareStrings(a, b) {
  return String(a).localeCompare(String(b), 'en');
}

function sortedUniqueStrings(values) {
  return [...new Set(arr(values).filter((value) => typeof value === 'string' && value.trim() !== ''))].sort(compareStrings);
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

function parseTaskNumber(taskId) {
  const match = /^TASK-(\d+)$/.exec(String(taskId));
  return match ? Number(match[1]) : null;
}

function formatTaskId(number) {
  return `TASK-${String(number).padStart(3, '0')}`;
}

function capabilityTypePriority(capability) {
  switch (capability?.type) {
    case 'enabling':
      return 0;
    case 'functional':
      return 1;
    case 'non_functional':
      return 2;
    case 'external':
      return 3;
    default:
      return 9;
  }
}

function topoSort(records, dependenciesOf, tieBreak) {
  const ids = records.map((record) => record.id);
  const availableIds = new Set(ids);
  const indegree = new Map(ids.map((id) => [id, 0]));
  const outgoing = new Map(ids.map((id) => [id, new Set()]));

  for (const record of records) {
    const sourceId = record.id;
    for (const dependencyId of sortedUniqueStrings(dependenciesOf(record))) {
      if (!availableIds.has(dependencyId) || dependencyId === sourceId) continue;
      if (outgoing.get(dependencyId).has(sourceId)) continue;
      outgoing.get(dependencyId).add(sourceId);
      indegree.set(sourceId, (indegree.get(sourceId) ?? 0) + 1);
    }
  }

  const queue = records.filter((record) => (indegree.get(record.id) ?? 0) === 0).sort(tieBreak);
  const ordered = [];

  while (queue.length > 0) {
    const current = queue.shift();
    ordered.push(current);
    const nextIds = [...(outgoing.get(current.id) ?? [])].sort(compareIds);
    for (const nextId of nextIds) {
      indegree.set(nextId, (indegree.get(nextId) ?? 0) - 1);
      if ((indegree.get(nextId) ?? 0) === 0) {
        queue.push(records.find((record) => record.id === nextId));
        queue.sort(tieBreak);
      }
    }
  }

  if (ordered.length !== records.length) {
    return [...records].sort(tieBreak);
  }

  return ordered;
}

async function readReservationDrafts() {
  const drafts = new Map();
  if (!(await exists(DRAFTS))) return drafts;

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
      capabilityTaskMap: Object.fromEntries(
        Object.entries(capabilityTaskMap)
          .filter(([capabilityId, taskId]) => typeof capabilityId === 'string' && typeof taskId === 'string')
          .sort(([, leftTaskId], [, rightTaskId]) => compareIds(leftTaskId, rightTaskId)),
      ),
      createdTaskIds: sortedUniqueStrings(reservation.createdTaskIds),
    });
  }

  return drafts;
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

async function main() {
  const { epicIds: requestedEpicIds, includeAll } = parseArgs(process.argv.slice(2));
  const epicPlan = await readJson(EPIC_FILE, 'epic-plan.json');
  const capabilityPlan = await readJson(CAPABILITY_FILE, 'capability-map.json');
  const taskPlan = await readJson(TASK_FILE, 'task-plan.json');
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

  const epics = arr(epicPlan.epics);
  const capabilities = arr(capabilityPlan.capabilities).filter(
    (capability) => obj(capability) && capability.implementationKind === 'planned',
  );
  const tasks = arr(taskPlan.tasks);
  indexById(tasks, 'task-plan.tasks');

  const occupiedNumbers = new Set();
  const reservedCapabilityIds = new Map();

  for (const task of tasks) {
    const number = parseTaskNumber(task.id);
    if (number !== null) occupiedNumbers.add(number);
    for (const capabilityId of sortedUniqueStrings(task.createsCapabilityIds)) {
      if (!reservedCapabilityIds.has(capabilityId)) reservedCapabilityIds.set(capabilityId, task.id);
    }
  }

  for (const capability of capabilities) {
    if (typeof capability.ownerTaskId === 'string' && capability.ownerTaskId.trim() !== '') {
      const number = parseTaskNumber(capability.ownerTaskId);
      if (number !== null) occupiedNumbers.add(number);
      reservedCapabilityIds.set(capability.id, capability.ownerTaskId);
    }
  }

  for (const reservation of reservationDrafts.values()) {
    for (const [capabilityId, taskId] of Object.entries(reservation.capabilityTaskMap)) {
      const number = parseTaskNumber(taskId);
      if (number !== null) occupiedNumbers.add(number);
      if (reservedCapabilityIds.has(capabilityId) && reservedCapabilityIds.get(capabilityId) !== taskId) {
        throw new Error(`Conflicto de reserva para ${capabilityId}: ${reservedCapabilityIds.get(capabilityId)} vs ${taskId}`);
      }
      reservedCapabilityIds.set(capabilityId, taskId);
    }
  }

  const epicRecords = topoSort(
    epics,
    (epic) => arr(epic.dependencyIds),
    (left, right) => compareIds(left.id, right.id),
  );
  const targetEpicIds = normalizeEpicTargets(epics, requestedEpicIds, includeAll);
  const targetEpicSet = new Set(targetEpicIds);
  const draftResults = [];
  let nextNumber = occupiedNumbers.size === 0 ? 1 : Math.max(...occupiedNumbers) + 1;

  await mkdir(DRAFTS, { recursive: true });

  for (const epic of epicRecords) {
    const epicId = epic.id;
    const ownedCapabilities = capabilities.filter((capability) => capability.ownerEpicId === epicId);
    if (ownedCapabilities.length === 0) continue;

    const providerIdsByCapability = new Map();
    for (const capability of ownedCapabilities) {
      const providerIds = new Set(sortedUniqueStrings(capability.requiredCapabilityIds));
      for (const other of ownedCapabilities) {
        if (arr(other.consumerCapabilityIds).includes(capability.id)) providerIds.add(other.id);
      }
      providerIdsByCapability.set(capability.id, [...providerIds].sort(compareIds));
    }

    const orderedCapabilities = topoSort(
      ownedCapabilities,
      (capability) => providerIdsByCapability.get(capability.id) ?? [],
      (left, right) => {
        const byType = capabilityTypePriority(left) - capabilityTypePriority(right);
        if (byType !== 0) return byType;
        const byName = compareStrings(left.name ?? left.id, right.name ?? right.id);
        return byName !== 0 ? byName : compareIds(left.id, right.id);
      },
    );

    const existingReservation = reservationDrafts.get(epicId)?.capabilityTaskMap ?? {};
    const capabilityTaskMap = {};

    for (const capability of orderedCapabilities) {
      let taskId = existingReservation[capability.id] ?? reservedCapabilityIds.get(capability.id) ?? null;
      if (!taskId) {
        while (occupiedNumbers.has(nextNumber)) nextNumber += 1;
        taskId = formatTaskId(nextNumber);
        occupiedNumbers.add(nextNumber);
        nextNumber += 1;
      }
      capabilityTaskMap[capability.id] = taskId;
      reservedCapabilityIds.set(capability.id, taskId);
    }

    if (!targetEpicSet.has(epicId)) continue;

    const orderedAssignments = Object.fromEntries(
      Object.entries(capabilityTaskMap)
        .sort(([, leftTaskId], [, rightTaskId]) => compareIds(leftTaskId, rightTaskId)),
    );
    const createdTaskIds = sortedUniqueStrings(Object.values(orderedAssignments));
    const draft = {
      schemaVersion: 1,
      status: 'reserved',
      epicId,
      createdTaskIds,
      capabilityTaskMap: orderedAssignments,
    };
    await writeJson(path.join(DRAFTS, `${epicId}.task-ids.json`), draft);
    draftResults.push({
      epicId,
      file: `.devflow/task-planner/drafts/${epicId}.task-ids.json`,
      createdTaskIds,
      capabilityTaskMap: orderedAssignments,
    });
  }

  process.stdout.write(`${JSON.stringify({
    tool: 'reserve-task-ids.mjs',
    version: TOOL_VERSION,
    epicCount: draftResults.length,
    results: draftResults,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Task id reservation failed: ${error.message}\n`);
  process.exitCode = 1;
});
