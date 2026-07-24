#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const VALIDATOR_NAME = 'validate-next-task.mjs';
const VALIDATOR_VERSION = '1.0';
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
const TASK_ID_PATTERN = /^TASK-(0*[1-9][0-9]*)$/;
const EPIC_ID_PATTERN = /^EPIC-[A-Z0-9][A-Z0-9_-]*$/;

const ROOT_KEYS = [
  'schemaVersion',
  'sourceSnapshot',
  'selectedTaskId',
  'epicId',
  'executionWave',
  'selectionReason',
  'otherReadyTaskIds',
  'classification',
  'issues',
];

const SNAPSHOT_KEYS = [
  'planningVersion',
  'epicPlanContentHash',
  'taskPlanContentHash',
  'capabilityMapContentHash',
  'executionStateRevision',
];

const REASON_KEYS = [
  'dependenciesCompleted',
  'attemptsAvailable',
  'taskStatus',
  'readyTaskCount',
  'unlocksTaskIds',
  'tieBreaker',
];

const ISSUE_KEYS = ['code', 'source', 'message', 'reference'];
const EXECUTION_ROOT_KEYS = [
  'schemaVersion',
  'engine',
  'project',
  'revision',
  'status',
  'policy',
  'tasks',
  'timestamps',
];
const ENGINE_KEYS = ['name', 'contractVersion'];
const EXECUTION_PROJECT_KEYS = ['id', 'planningVersion'];
const POLICY_KEYS = ['defaultMaxAttempts', 'maxConcurrentTasks'];
const TASK_EXECUTION_KEYS = [
  'taskId',
  'status',
  'attemptCount',
  'maxAttempts',
  'activeRunId',
  'reservation',
  'blocker',
  'lastResult',
  'updatedAt',
];
const TIMESTAMP_KEYS = ['createdAt', 'updatedAt'];
const RESERVATION_KEYS = ['token', 'reservedAt', 'stateRevision'];
const BLOCKER_KEYS = ['code', 'message', 'source'];
const LAST_RESULT_KEYS = ['classification', 'runId', 'completedAt'];
const READY_STATUSES = new Set(['pending', 'interrupted', 'failed_retryable']);
const ACTIVE_STATUSES = new Set([
  'reserved',
  'running',
  'waiting_human',
  'waiting_external',
]);
const EXECUTION_STATUSES = new Set([
  'initialized',
  'active',
  'paused',
  'completed',
  'failed',
]);
const TASK_STATUSES = new Set([
  'pending',
  'reserved',
  'running',
  'waiting_human',
  'waiting_external',
  'blocked',
  'interrupted',
  'completed',
  'failed_retryable',
  'failed_permanent',
  'cancelled',
]);
const CLASSIFICATIONS = new Set([
  'NOT_EVALUATED',
  'TASK_SELECTED',
  'NO_READY_TASK',
  'PLAN_NOT_READY',
  'INPUT_INVALID',
  'STATE_CONFLICT',
]);

const FILES = {
  projectState: '.devflow/task-planner/project-state.json',
  readiness: '.devflow/task-planner/readiness.json',
  epicPlan: '.devflow/task-planner/epic-plan.json',
  taskPlan: '.devflow/task-planner/task-plan.json',
  capabilityMap: '.devflow/task-planner/capability-map.json',
  executionState: '.devflow/execution/execution-state.json',
  executionSchema: '.devflow/execution/execution-state.schema.json',
  selectionSchema: '.devflow/execution/task-selection.schema.json',
  selection: '.devflow/execution/selection.json',
};

function usage() {
  console.error(`Uso: node ${VALIDATOR_NAME} [--root RUTA] [--json] [--quiet]`);
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    json: false,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('Falta el valor de --root.');
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Argumento desconocido: ${arg}`);
    }
  }

  return options;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 1;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isDateTimeOrNull(value) {
  return value === null
    || (typeof value === 'string'
      && value.trim() !== ''
      && !Number.isNaN(Date.parse(value)));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function artifactDigest(document) {
  const clone = structuredClone(document);
  if (isObject(clone.timestamps)) delete clone.timestamps.contentHash;
  const serialized = JSON.stringify(canonical(clone));
  return `sha256:${createHash('sha256').update(serialized).digest('hex')}`;
}

function issue(code, source, message, reference = null) {
  return { code, source, message, reference };
}

function pushUniqueIssue(collection, entry) {
  const signature = `${entry.code}\u0000${entry.source}\u0000${entry.reference ?? ''}`;
  if (!collection.some((existing) => (
    `${existing.code}\u0000${existing.source}\u0000${existing.reference ?? ''}` === signature
  ))) {
    collection.push(entry);
  }
}

function taskNumericId(taskId) {
  if (typeof taskId !== 'string') return null;
  const match = TASK_ID_PATTERN.exec(taskId);
  if (!match) return null;
  return BigInt(match[1]);
}

function compareTaskIds(left, right) {
  const leftValue = taskNumericId(left);
  const rightValue = taskNumericId(right);
  if (leftValue === null && rightValue === null) return String(left).localeCompare(String(right));
  if (leftValue === null) return 1;
  if (rightValue === null) return -1;
  if (leftValue < rightValue) return -1;
  if (leftValue > rightValue) return 1;
  return String(left).localeCompare(String(right));
}

function sameKeys(value, expectedKeys) {
  return isObject(value) && JSON.stringify(Object.keys(value)) === JSON.stringify(expectedKeys);
}

async function loadJson(root, relativePath, inputIssues, { required = true } = {}) {
  const absolutePath = path.join(root, relativePath);
  let raw;

  try {
    raw = await readFile(absolutePath, 'utf8');
  } catch (error) {
    if (required) {
      pushUniqueIssue(
        inputIssues,
        issue(
          'REQUIRED_FILE_MISSING',
          relativePath,
          `No existe el archivo obligatorio ${relativePath}.`,
          null,
        ),
      );
    }
    return { raw: null, value: null };
  }

  try {
    const value = JSON.parse(raw);
    if (!isObject(value)) {
      pushUniqueIssue(
        inputIssues,
        issue(
          'DOCUMENT_ROOT_INVALID',
          relativePath,
          'La raíz del documento debe ser un objeto JSON.',
          null,
        ),
      );
      return { raw, value: null };
    }
    return { raw, value };
  } catch (error) {
    pushUniqueIssue(
      inputIssues,
      issue(
        'JSON_INVALID',
        relativePath,
        `El archivo no contiene JSON válido: ${error.message}`,
        null,
      ),
    );
    return { raw, value: null };
  }
}

function requireObject(parent, key, source, inputIssues, reference = key) {
  const value = parent?.[key];
  if (!isObject(value)) {
    pushUniqueIssue(
      inputIssues,
      issue('FIELD_INVALID', source, `${reference} debe ser un objeto.`, reference),
    );
    return null;
  }
  return value;
}

function requireArray(parent, key, source, inputIssues, reference = key) {
  const value = parent?.[key];
  if (!Array.isArray(value)) {
    pushUniqueIssue(
      inputIssues,
      issue('FIELD_INVALID', source, `${reference} debe ser un arreglo.`, reference),
    );
    return [];
  }
  return value;
}

function validateTaskCollection(records, source, field, inputIssues) {
  const exactIds = new Set();
  const numericOwners = new Map();
  const valid = [];

  for (const [index, record] of records.entries()) {
    const reference = `${field}[${index}]`;
    if (!isObject(record)) {
      pushUniqueIssue(
        inputIssues,
        issue('FIELD_INVALID', source, `${reference} debe ser un objeto.`, reference),
      );
      continue;
    }

    const id = record.id ?? record.taskId;
    const numericId = taskNumericId(id);
    if (numericId === null) {
      pushUniqueIssue(
        inputIssues,
        issue('TASK_ID_INVALID', source, `${reference} tiene un identificador de tarea inválido.`, reference),
      );
      continue;
    }

    if (exactIds.has(id)) {
      pushUniqueIssue(
        inputIssues,
        issue('TASK_ID_DUPLICATED', source, `${id} aparece más de una vez.`, id),
      );
      continue;
    }
    exactIds.add(id);

    const numericKey = numericId.toString();
    const previous = numericOwners.get(numericKey);
    if (previous && previous !== id) {
      pushUniqueIssue(
        inputIssues,
        issue(
          'TASK_ID_NUMERIC_COLLISION',
          source,
          `${previous} y ${id} representan el mismo identificador numérico.`,
          id,
        ),
      );
      continue;
    }
    numericOwners.set(numericKey, id);
    valid.push(record);
  }

  return { valid, numericOwners };
}

function validateEpicCollection(records, source, inputIssues) {
  const ids = new Set();
  const valid = [];

  for (const [index, epic] of records.entries()) {
    const reference = `epics[${index}]`;
    if (!isObject(epic)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference} debe ser un objeto.`, reference));
      continue;
    }
    if (typeof epic.id !== 'string' || !EPIC_ID_PATTERN.test(epic.id)) {
      pushUniqueIssue(inputIssues, issue('EPIC_ID_INVALID', source, `${reference}.id es inválido.`, reference));
      continue;
    }
    if (ids.has(epic.id)) {
      pushUniqueIssue(inputIssues, issue('EPIC_ID_DUPLICATED', source, `${epic.id} aparece más de una vez.`, epic.id));
      continue;
    }
    ids.add(epic.id);
    if (!isPositiveInteger(epic.executionWave)) {
      pushUniqueIssue(
        inputIssues,
        issue('FIELD_INVALID', source, `${epic.id}.executionWave debe ser un entero positivo.`, epic.id),
      );
    }
    valid.push(epic);
  }

  return valid;
}

function validateContentHash(document, source, inputIssues, { required = true } = {}) {
  const hash = document?.timestamps?.contentHash;
  if (hash === null || typeof hash === 'undefined') {
    if (required) {
      pushUniqueIssue(
        inputIssues,
        issue('CONTENT_HASH_INVALID', source, 'timestamps.contentHash es obligatorio para un artefacto validado o publicado.', 'timestamps.contentHash'),
      );
    }
    return null;
  }
  if (typeof hash !== 'string' || !HASH_PATTERN.test(hash)) {
    pushUniqueIssue(
      inputIssues,
      issue('CONTENT_HASH_INVALID', source, 'timestamps.contentHash no es un hash sha256 válido.', 'timestamps.contentHash'),
    );
    return null;
  }

  const expected = artifactDigest(document);
  if (hash !== expected) {
    pushUniqueIssue(
      inputIssues,
      issue(
        'CONTENT_HASH_MISMATCH',
        source,
        'timestamps.contentHash no corresponde con el contenido actual del documento.',
        'timestamps.contentHash',
      ),
    );
  }
  return hash;
}

function findTaskCycle(tasks) {
  const graph = new Map(tasks.map((task) => [task.id, Array.isArray(task.dependencyIds) ? task.dependencyIds : []]));
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(taskId) {
    if (visiting.has(taskId)) {
      const start = stack.indexOf(taskId);
      return [...stack.slice(start), taskId];
    }
    if (visited.has(taskId)) return null;

    visiting.add(taskId);
    stack.push(taskId);
    for (const dependencyId of graph.get(taskId) ?? []) {
      if (!graph.has(dependencyId)) continue;
      const cycle = visit(dependencyId);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(taskId);
    visited.add(taskId);
    return null;
  }

  for (const taskId of graph.keys()) {
    const cycle = visit(taskId);
    if (cycle) return cycle;
  }
  return null;
}

function snapshotFrom(documents) {
  const planningVersion = documents.projectState?.project?.planningVersion;
  const epicHash = documents.epicPlan?.timestamps?.contentHash;
  const taskHash = documents.taskPlan?.timestamps?.contentHash;
  const capabilityHash = documents.capabilityMap?.timestamps?.contentHash;
  const revision = documents.executionState?.revision;

  if (
    !isPositiveInteger(planningVersion)
    || !HASH_PATTERN.test(epicHash ?? '')
    || !HASH_PATTERN.test(taskHash ?? '')
    || !HASH_PATTERN.test(capabilityHash ?? '')
    || !isNonNegativeInteger(revision)
  ) {
    return null;
  }

  return {
    planningVersion,
    epicPlanContentHash: epicHash,
    taskPlanContentHash: taskHash,
    capabilityMapContentHash: capabilityHash,
    executionStateRevision: revision,
  };
}

function errorSelection(classification, sourceSnapshot, issues) {
  return {
    schemaVersion: 1,
    sourceSnapshot,
    selectedTaskId: null,
    epicId: null,
    executionWave: null,
    selectionReason: null,
    otherReadyTaskIds: [],
    classification,
    issues,
  };
}

function noReadySelection(sourceSnapshot) {
  return {
    schemaVersion: 1,
    sourceSnapshot,
    selectedTaskId: null,
    epicId: null,
    executionWave: null,
    selectionReason: null,
    otherReadyTaskIds: [],
    classification: 'NO_READY_TASK',
    issues: [],
  };
}

function validateExecutionStateShape(executionState, inputIssues) {
  const source = FILES.executionState;
  if (!executionState) return [];

  if (!sameKeys(executionState, EXECUTION_ROOT_KEYS)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'La raíz no conserva exactamente la estructura contractual.', null));
  }
  if (executionState.schemaVersion !== 1) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'schemaVersion debe ser 1.', 'schemaVersion'));
  }

  const engine = requireObject(executionState, 'engine', source, inputIssues);
  if (engine) {
    if (!sameKeys(engine, ENGINE_KEYS)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'engine no conserva la estructura contractual.', 'engine'));
    }
    if (engine.name !== 'next-task' || engine.contractVersion !== '1.0') {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'engine debe declarar next-task contractVersion 1.0.', 'engine'));
    }
  }

  const project = requireObject(executionState, 'project', source, inputIssues);
  if (project) {
    if (!sameKeys(project, EXECUTION_PROJECT_KEYS)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'project no conserva la estructura contractual.', 'project'));
    }
    if (typeof project.id !== 'string' || project.id.trim() === '') {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'project.id debe ser un string no vacío.', 'project.id'));
    }
    if (!isPositiveInteger(project.planningVersion)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'project.planningVersion debe ser un entero positivo.', 'project.planningVersion'));
    }
  }

  if (!isNonNegativeInteger(executionState.revision)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'revision debe ser un entero no negativo.', 'revision'));
  }
  if (!EXECUTION_STATUSES.has(executionState.status)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'status tiene un valor no permitido.', 'status'));
  }

  const policy = requireObject(executionState, 'policy', source, inputIssues);
  if (policy) {
    if (!sameKeys(policy, POLICY_KEYS)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'policy no conserva la estructura contractual.', 'policy'));
    }
    if (!isPositiveInteger(policy.defaultMaxAttempts)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'policy.defaultMaxAttempts debe ser un entero positivo.', 'policy.defaultMaxAttempts'));
    }
    if (!isPositiveInteger(policy.maxConcurrentTasks)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'policy.maxConcurrentTasks debe ser un entero positivo.', 'policy.maxConcurrentTasks'));
    }
  }

  const timestamps = requireObject(executionState, 'timestamps', source, inputIssues);
  if (timestamps) {
    if (!sameKeys(timestamps, TIMESTAMP_KEYS)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'timestamps no conserva la estructura contractual.', 'timestamps'));
    }
    if (!isDateTimeOrNull(timestamps.createdAt)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'timestamps.createdAt debe ser null o date-time válido.', 'timestamps.createdAt'));
    }
    if (!isDateTimeOrNull(timestamps.updatedAt)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'timestamps.updatedAt debe ser null o date-time válido.', 'timestamps.updatedAt'));
    }
  }

  const taskRecords = requireArray(executionState, 'tasks', source, inputIssues);
  for (const [index, entry] of taskRecords.entries()) {
    if (!isObject(entry)) continue;
    const reference = entry.taskId ?? `tasks[${index}]`;

    if (!sameKeys(entry, TASK_EXECUTION_KEYS)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference} no conserva la estructura contractual.`, reference));
    }
    if (!TASK_STATUSES.has(entry.status)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.status no está permitido.`, reference));
    }
    if (!isNonNegativeInteger(entry.attemptCount)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.attemptCount debe ser un entero no negativo.`, reference));
    }
    if (!isPositiveInteger(entry.maxAttempts)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.maxAttempts debe ser un entero positivo.`, reference));
    }
    if (!(entry.activeRunId === null || (typeof entry.activeRunId === 'string' && entry.activeRunId.trim() !== ''))) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.activeRunId debe ser null o string no vacío.`, reference));
    }

    if (!(entry.reservation === null || isObject(entry.reservation))) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.reservation debe ser null u objeto.`, reference));
    } else if (isObject(entry.reservation)) {
      if (!sameKeys(entry.reservation, RESERVATION_KEYS)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.reservation no conserva la estructura contractual.`, reference));
      }
      if (typeof entry.reservation.token !== 'string' || entry.reservation.token.trim() === '') {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.reservation.token es inválido.`, reference));
      }
      if (!isDateTimeOrNull(entry.reservation.reservedAt) || entry.reservation.reservedAt === null) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.reservation.reservedAt debe ser date-time válido.`, reference));
      }
      if (!isNonNegativeInteger(entry.reservation.stateRevision)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.reservation.stateRevision debe ser un entero no negativo.`, reference));
      }
    }

    if (!(entry.blocker === null || isObject(entry.blocker))) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.blocker debe ser null u objeto.`, reference));
    } else if (isObject(entry.blocker)) {
      if (!sameKeys(entry.blocker, BLOCKER_KEYS)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.blocker no conserva la estructura contractual.`, reference));
      }
      if (typeof entry.blocker.code !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(entry.blocker.code)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.blocker.code es inválido.`, reference));
      }
      for (const field of ['message', 'source']) {
        if (typeof entry.blocker[field] !== 'string' || entry.blocker[field].trim() === '') {
          pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.blocker.${field} es inválido.`, reference));
        }
      }
    }

    if (!(entry.lastResult === null || isObject(entry.lastResult))) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.lastResult debe ser null u objeto.`, reference));
    } else if (isObject(entry.lastResult)) {
      if (!sameKeys(entry.lastResult, LAST_RESULT_KEYS)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.lastResult no conserva la estructura contractual.`, reference));
      }
      if (!['SUCCEEDED', 'FAILED', 'INTERRUPTED', 'CANCELLED'].includes(entry.lastResult.classification)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.lastResult.classification es inválido.`, reference));
      }
      if (typeof entry.lastResult.runId !== 'string' || entry.lastResult.runId.trim() === '') {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.lastResult.runId es inválido.`, reference));
      }
      if (!isDateTimeOrNull(entry.lastResult.completedAt) || entry.lastResult.completedAt === null) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.lastResult.completedAt debe ser date-time válido.`, reference));
      }
    }

    if (!isDateTimeOrNull(entry.updatedAt)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.updatedAt debe ser null o date-time válido.`, reference));
    }
  }

  return taskRecords;
}

function validateSelectionShape(selection, raw, reportErrors) {
  if (!selection) return;

  if (!sameKeys(selection, ROOT_KEYS)) {
    reportErrors.push('selection.json no conserva exactamente las claves raíz requeridas y su orden contractual.');
  }
  if (selection.schemaVersion !== 1) {
    reportErrors.push('selection.json.schemaVersion debe ser 1.');
  }
  if (!CLASSIFICATIONS.has(selection.classification) || selection.classification === 'NOT_EVALUATED') {
    reportErrors.push('selection.json.classification no es una clasificación ejecutable válida.');
  }
  if (!Array.isArray(selection.otherReadyTaskIds)) {
    reportErrors.push('selection.json.otherReadyTaskIds debe ser un arreglo.');
  }
  if (!Array.isArray(selection.issues)) {
    reportErrors.push('selection.json.issues debe ser un arreglo.');
  }

  if (selection.sourceSnapshot !== null && !sameKeys(selection.sourceSnapshot, SNAPSHOT_KEYS)) {
    reportErrors.push('selection.json.sourceSnapshot no conserva la estructura contractual.');
  }
  if (selection.selectionReason !== null && !sameKeys(selection.selectionReason, REASON_KEYS)) {
    reportErrors.push('selection.json.selectionReason no conserva la estructura contractual.');
  }
  if (Array.isArray(selection.issues)) {
    for (const [index, entry] of selection.issues.entries()) {
      if (!sameKeys(entry, ISSUE_KEYS)) {
        reportErrors.push(`selection.json.issues[${index}] no conserva la estructura contractual.`);
        continue;
      }
      if (typeof entry.code !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(entry.code)) {
        reportErrors.push(`selection.json.issues[${index}].code es inválido.`);
      }
      if (typeof entry.source !== 'string' || entry.source.trim() === '') {
        reportErrors.push(`selection.json.issues[${index}].source es inválido.`);
      }
      if (typeof entry.message !== 'string' || entry.message.trim() === '') {
        reportErrors.push(`selection.json.issues[${index}].message es inválido.`);
      }
      if (!(entry.reference === null || (typeof entry.reference === 'string' && entry.reference.trim() !== ''))) {
        reportErrors.push(`selection.json.issues[${index}].reference es inválido.`);
      }
    }
  }

  if (raw !== null) {
    const expectedFormatting = `${JSON.stringify(selection, null, 2)}\n`;
    if (raw !== expectedFormatting) {
      reportErrors.push('selection.json debe usar dos espacios, el orden contractual de claves y un único salto de línea final.');
    }
  }
}

async function computeExpected(root) {
  const inputIssues = [];
  const stateIssues = [];
  const planIssues = [];

  const loaded = {};
  for (const [key, relativePath] of Object.entries(FILES)) {
    if (key === 'selection') continue;
    loaded[key] = await loadJson(root, relativePath, inputIssues);
  }

  const documents = Object.fromEntries(
    Object.entries(loaded).map(([key, result]) => [key, result.value]),
  );

  const projectState = documents.projectState;
  const readiness = documents.readiness;
  const epicPlan = documents.epicPlan;
  const taskPlan = documents.taskPlan;
  const capabilityMap = documents.capabilityMap;
  const executionState = documents.executionState;

  if (documents.executionSchema && documents.executionSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', FILES.executionSchema, 'El schema debe declarar JSON Schema Draft 2020-12.', '$schema'));
  }
  if (documents.selectionSchema && documents.selectionSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', FILES.selectionSchema, 'El schema debe declarar JSON Schema Draft 2020-12.', '$schema'));
  }

  const project = projectState ? requireObject(projectState, 'project', FILES.projectState, inputIssues) : null;
  if (project) {
    if (typeof project.id !== 'string' || project.id.trim() === '') {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', FILES.projectState, 'project.id debe ser un string no vacío.', 'project.id'));
    }
    if (!isPositiveInteger(project.planningVersion)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', FILES.projectState, 'project.planningVersion debe ser un entero positivo.', 'project.planningVersion'));
    }
  }

  if (readiness && !isObject(readiness.summary)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', FILES.readiness, 'summary debe ser un objeto.', 'summary'));
  }

  const epicRecords = epicPlan ? requireArray(epicPlan, 'epics', FILES.epicPlan, inputIssues) : [];
  const taskRecords = taskPlan ? requireArray(taskPlan, 'tasks', FILES.taskPlan, inputIssues) : [];
  if (capabilityMap) requireArray(capabilityMap, 'capabilities', FILES.capabilityMap, inputIssues);

  const epics = validateEpicCollection(epicRecords, FILES.epicPlan, inputIssues);
  const taskValidation = validateTaskCollection(taskRecords, FILES.taskPlan, 'tasks', inputIssues);
  const tasks = taskValidation.valid;
  const executionTaskRecords = validateExecutionStateShape(executionState, inputIssues);
  const executionValidation = validateTaskCollection(executionTaskRecords, FILES.executionState, 'tasks', inputIssues);

  if (epicPlan) {
    validateContentHash(
      epicPlan,
      FILES.epicPlan,
      inputIssues,
      { required: ['validated', 'published'].includes(epicPlan.status) },
    );
  }
  if (taskPlan) {
    validateContentHash(
      taskPlan,
      FILES.taskPlan,
      inputIssues,
      { required: ['validated', 'published'].includes(taskPlan.status) },
    );
  }
  if (capabilityMap) {
    validateContentHash(
      capabilityMap,
      FILES.capabilityMap,
      inputIssues,
      { required: capabilityMap.status === 'validated' },
    );
  }

  if (inputIssues.length > 0) {
    return {
      expected: errorSelection('INPUT_INVALID', null, inputIssues),
      documents,
    };
  }

  const snapshot = snapshotFrom(documents);
  const epicMap = new Map(epics.map((epic) => [epic.id, epic]));
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const planTaskByNumeric = taskValidation.numericOwners;
  const executionByTaskId = new Map();

  if (executionState.project.id !== projectState.project.id) {
    pushUniqueIssue(
      stateIssues,
      issue('PROJECT_ID_MISMATCH', FILES.executionState, 'El proyecto del estado de ejecución no coincide con el plan.', 'project.id'),
    );
  }
  if (executionState.project.planningVersion !== projectState.project.planningVersion) {
    pushUniqueIssue(
      stateIssues,
      issue('PLANNING_VERSION_MISMATCH', FILES.executionState, 'La versión de planificación del estado no coincide con el plan.', 'project.planningVersion'),
    );
  }

  for (const task of tasks) {
    if (!epicMap.has(task.epicId)) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_EPIC_UNKNOWN', FILES.taskPlan, `${task.id} referencia una épica inexistente.`, task.id),
      );
    }
    if (!Array.isArray(task.dependencyIds)) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_DEPENDENCIES_INVALID', FILES.taskPlan, `${task.id}.dependencyIds debe ser un arreglo.`, task.id),
      );
      continue;
    }
    for (const dependencyId of task.dependencyIds) {
      if (taskNumericId(dependencyId) === null) {
        pushUniqueIssue(
          stateIssues,
          issue('TASK_DEPENDENCY_ID_INVALID', FILES.taskPlan, `${task.id} contiene una dependencia inválida.`, task.id),
        );
      } else if (!taskMap.has(dependencyId)) {
        pushUniqueIssue(
          stateIssues,
          issue('TASK_DEPENDENCY_UNKNOWN', FILES.taskPlan, `${task.id} depende de una tarea inexistente.`, task.id),
        );
      }
      if (dependencyId === task.id) {
        pushUniqueIssue(
          stateIssues,
          issue('TASK_DEPENDENCY_SELF_REFERENCE', FILES.taskPlan, `${task.id} depende de sí misma.`, task.id),
        );
      }
    }
  }

  const cycle = findTaskCycle(tasks);
  if (cycle) {
    pushUniqueIssue(
      stateIssues,
      issue('TASK_DEPENDENCY_CYCLE', FILES.taskPlan, `El grafo de tareas contiene un ciclo: ${cycle.join(' -> ')}.`, cycle[0]),
    );
  }

  for (const entry of executionValidation.valid) {
    const numeric = taskNumericId(entry.taskId).toString();
    const planId = planTaskByNumeric.get(numeric);
    if (!planId) {
      pushUniqueIssue(
        stateIssues,
        issue('EXECUTION_TASK_UNKNOWN', FILES.executionState, `${entry.taskId} no existe en el plan de tareas.`, entry.taskId),
      );
      continue;
    }
    if (planId !== entry.taskId) {
      pushUniqueIssue(
        stateIssues,
        issue('EXECUTION_TASK_ID_MISMATCH', FILES.executionState, `${entry.taskId} no coincide con la representación canónica ${planId}.`, entry.taskId),
      );
      continue;
    }
    executionByTaskId.set(entry.taskId, entry);

    if (entry.attemptCount > entry.maxAttempts) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_STATE_INCONSISTENT', FILES.executionState, `${entry.taskId}.attemptCount supera maxAttempts.`, entry.taskId),
      );
    }
    if (entry.status === 'reserved' && entry.reservation === null) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_STATE_INCONSISTENT', FILES.executionState, `${entry.taskId} está reserved sin reservation.`, entry.taskId),
      );
    }
    if (['running', 'waiting_human', 'waiting_external'].includes(entry.status) && entry.activeRunId === null) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_STATE_INCONSISTENT', FILES.executionState, `${entry.taskId} tiene un estado activo sin activeRunId.`, entry.taskId),
      );
    }
    if (['pending', 'interrupted', 'completed', 'failed_retryable', 'failed_permanent', 'cancelled', 'blocked'].includes(entry.status)
      && (entry.activeRunId !== null || entry.reservation !== null)) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_STATE_INCONSISTENT', FILES.executionState, `${entry.taskId} tiene run o reserva incompatible con su estado.`, entry.taskId),
      );
    }
    if (entry.status === 'blocked' && entry.blocker === null) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_STATE_INCONSISTENT', FILES.executionState, `${entry.taskId} está blocked sin blocker.`, entry.taskId),
      );
    }
    if (entry.status !== 'blocked' && entry.blocker !== null) {
      pushUniqueIssue(
        stateIssues,
        issue('TASK_STATE_INCONSISTENT', FILES.executionState, `${entry.taskId} tiene blocker sin estado blocked.`, entry.taskId),
      );
    }
  }

  if (projectState.progress?.planPublished === true) {
    if (epicPlan.status !== 'published' || taskPlan.status !== 'published') {
      pushUniqueIssue(
        stateIssues,
        issue('PLAN_STATUS_CONFLICT', FILES.projectState, 'El estado declara el plan publicado, pero los artefactos no están published.', 'progress.planPublished'),
      );
    }
  }
  if (projectState.progress?.finalPlanApproved === true && projectState.approvals?.finalPlan?.status !== 'approved') {
    pushUniqueIssue(
      stateIssues,
      issue('PLAN_STATUS_CONFLICT', FILES.projectState, 'El progreso declara aprobación final sin un registro approved.', 'progress.finalPlanApproved'),
    );
  }
  if (executionState.status === 'failed') {
    pushUniqueIssue(
      stateIssues,
      issue('EXECUTION_STATE_FAILED', FILES.executionState, 'El estado global de ejecución está failed.', 'status'),
    );
  }

  if (stateIssues.length > 0) {
    return {
      expected: errorSelection('STATE_CONFLICT', snapshot, stateIssues),
      documents,
    };
  }

  if (projectState.approvals?.finalPlan?.status !== 'approved') {
    pushUniqueIssue(
      planIssues,
      issue('FINAL_PLAN_NOT_APPROVED', FILES.projectState, 'El plan final todavía no está aprobado.', 'approvals.finalPlan.status'),
    );
  }
  if (projectState.progress?.planValidated !== true) {
    pushUniqueIssue(
      planIssues,
      issue('PLAN_NOT_VALIDATED', FILES.projectState, 'El plan todavía no está validado.', 'progress.planValidated'),
    );
  }
  if (projectState.progress?.planPublished !== true) {
    pushUniqueIssue(
      planIssues,
      issue('PLAN_NOT_PUBLISHED', FILES.projectState, 'El plan todavía no está publicado.', 'progress.planPublished'),
    );
  }
  if (projectState.progress?.finalPlanApproved !== true) {
    pushUniqueIssue(
      planIssues,
      issue('FINAL_PLAN_NOT_APPROVED', FILES.projectState, 'El progreso del plan todavía no registra la aprobación final.', 'progress.finalPlanApproved'),
    );
  }
  if (readiness.status !== 'passed') {
    pushUniqueIssue(
      planIssues,
      issue('READINESS_NOT_PASSED', FILES.readiness, 'La validación de readiness no está passed.', 'status'),
    );
  }
  if (typeof readiness.summary?.errors !== 'undefined' && readiness.summary.errors !== 0) {
    pushUniqueIssue(
      planIssues,
      issue('READINESS_HAS_ERRORS', FILES.readiness, 'La validación de readiness contiene errores.', 'summary.errors'),
    );
  }
  if (capabilityMap.status !== 'validated') {
    pushUniqueIssue(
      planIssues,
      issue('PLAN_NOT_VALIDATED', FILES.capabilityMap, 'El mapa de capacidades no está validated.', 'status'),
    );
  }

  if (planIssues.length > 0) {
    return {
      expected: errorSelection('PLAN_NOT_READY', snapshot, planIssues),
      documents,
    };
  }

  if (executionState.status === 'paused' || executionState.status === 'completed') {
    return { expected: noReadySelection(snapshot), documents };
  }

  const defaultState = (taskId) => executionByTaskId.get(taskId) ?? {
    taskId,
    status: 'pending',
    attemptCount: 0,
    maxAttempts: executionState.policy.defaultMaxAttempts,
    activeRunId: null,
    reservation: null,
    blocker: null,
    lastResult: null,
    updatedAt: null,
  };

  const activeCount = tasks.reduce((count, task) => {
    const state = defaultState(task.id);
    const active = ACTIVE_STATUSES.has(state.status)
      || state.activeRunId !== null
      || state.reservation !== null;
    return count + (active ? 1 : 0);
  }, 0);

  if (activeCount >= executionState.policy.maxConcurrentTasks) {
    return { expected: noReadySelection(snapshot), documents };
  }

  const ready = [];
  for (const task of tasks) {
    const epic = epicMap.get(task.epicId);
    if (!epic || !isPositiveInteger(epic.executionWave)) continue;
    const state = defaultState(task.id);
    const dependenciesCompleted = task.dependencyIds.every(
      (dependencyId) => defaultState(dependencyId).status === 'completed',
    );
    const available = dependenciesCompleted
      && READY_STATUSES.has(state.status)
      && state.attemptCount < state.maxAttempts
      && state.activeRunId === null
      && state.reservation === null
      && state.blocker === null;
    if (available) ready.push({ task, epic, state });
  }

  ready.sort((left, right) => {
    if (left.epic.executionWave !== right.epic.executionWave) {
      return left.epic.executionWave - right.epic.executionWave;
    }
    return compareTaskIds(left.task.id, right.task.id);
  });

  if (ready.length === 0) {
    return { expected: noReadySelection(snapshot), documents };
  }

  const selected = ready[0];
  const unlocks = tasks
    .filter((task) => task.dependencyIds.includes(selected.task.id))
    .filter((task) => {
      const incomplete = task.dependencyIds.filter(
        (dependencyId) => defaultState(dependencyId).status !== 'completed',
      );
      return incomplete.length === 1 && incomplete[0] === selected.task.id;
    })
    .map((task) => task.id)
    .sort(compareTaskIds);

  const expected = {
    schemaVersion: 1,
    sourceSnapshot: snapshot,
    selectedTaskId: selected.task.id,
    epicId: selected.epic.id,
    executionWave: selected.epic.executionWave,
    selectionReason: {
      dependenciesCompleted: true,
      attemptsAvailable: true,
      taskStatus: selected.state.status,
      readyTaskCount: ready.length,
      unlocksTaskIds: unlocks,
      tieBreaker: 'lowest-execution-wave-then-lowest-task-id',
    },
    otherReadyTaskIds: ready.slice(1).map((entry) => entry.task.id),
    classification: 'TASK_SELECTED',
    issues: [],
  };

  return { expected, documents };
}

function issueSignature(entry) {
  return `${entry.code}\u0000${entry.source}\u0000${entry.reference ?? ''}`;
}

function compareActualToExpected(actual, expected, reportErrors) {
  if (!actual) return;

  const actualWithoutIssues = { ...actual, issues: [] };
  const expectedWithoutIssues = { ...expected, issues: [] };
  if (JSON.stringify(actualWithoutIssues) !== JSON.stringify(expectedWithoutIssues)) {
    reportErrors.push('selection.json no coincide con la selección determinista esperada.');
  }

  const actualIssues = Array.isArray(actual.issues) ? actual.issues.map(issueSignature) : [];
  const expectedIssues = expected.issues.map(issueSignature);
  if (JSON.stringify(actualIssues) !== JSON.stringify(expectedIssues)) {
    reportErrors.push('Los códigos, fuentes o referencias de issues no coinciden con el resultado esperado.');
  }
}

function printHumanReport(report) {
  if (report.status === 'passed') {
    console.log('Next Task validation passed');
    console.log(`classification: ${report.classification}`);
    if (report.selectedTaskId) console.log(`selectedTaskId: ${report.selectedTaskId}`);
    return;
  }

  console.error('Next Task validation failed');
  for (const error of report.errors) console.error(`- ${error}`);
  console.error(`expectedClassification: ${report.expectedClassification}`);
  if (report.expectedSelectedTaskId) {
    console.error(`expectedSelectedTaskId: ${report.expectedSelectedTaskId}`);
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exit(2);
  }

  const reportErrors = [];
  const { expected } = await computeExpected(options.root);
  const selectionLoaded = await loadJson(options.root, FILES.selection, [], { required: true });
  const actual = selectionLoaded.value;

  if (selectionLoaded.raw === null) {
    reportErrors.push(`No existe ${FILES.selection}.`);
  } else if (!actual) {
    reportErrors.push(`${FILES.selection} no contiene un objeto JSON válido.`);
  }

  validateSelectionShape(actual, selectionLoaded.raw, reportErrors);
  compareActualToExpected(actual, expected, reportErrors);

  const report = {
    schemaVersion: 1,
    validator: {
      name: VALIDATOR_NAME,
      version: VALIDATOR_VERSION,
    },
    status: reportErrors.length === 0 ? 'passed' : 'failed',
    classification: actual?.classification ?? null,
    selectedTaskId: actual?.selectedTaskId ?? null,
    expectedClassification: expected.classification,
    expectedSelectedTaskId: expected.selectedTaskId,
    errors: reportErrors,
  };

  if (!options.quiet) {
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printHumanReport(report);
  }

  process.exit(reportErrors.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(`Error interno de ${VALIDATOR_NAME}: ${error.stack ?? error.message}`);
  process.exit(2);
});
