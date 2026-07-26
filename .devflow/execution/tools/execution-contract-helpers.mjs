import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const CONTRACT_VERSION = '1.0';

export const FILES = {
  executionState: '.devflow/execution/execution-state.json',
  selection: '.devflow/execution/selection.json',
  executionSchema: '.devflow/execution/execution-state.schema.json',
  selectionSchema: '.devflow/execution/task-selection.schema.json',
};

export const NEXT_TASK_RUNTIME_FILES = [
  FILES.selection,
  FILES.selectionSchema,
  '.devflow/execution/tools/select-next-task.mjs',
  '.devflow/execution/tools/validate-next-task.mjs',
];

export const EXECUTION_ENGINE_FILES = {
  lock: '.devflow/execution/lock',
  journal: '.devflow/execution/transition-journal.json',
};

export const EXECUTION_ROOT_KEYS = [
  'schemaVersion',
  'engine',
  'project',
  'revision',
  'status',
  'policy',
  'tasks',
  'timestamps',
];

export const ENGINE_KEYS = ['name', 'contractVersion'];
export const EXECUTION_PROJECT_KEYS = ['id', 'planningVersion'];
export const POLICY_KEYS = ['defaultMaxAttempts', 'maxConcurrentTasks'];
export const TASK_EXECUTION_KEYS = [
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
export const TIMESTAMP_KEYS = ['createdAt', 'updatedAt'];
export const RESERVATION_KEYS = ['token', 'reservedAt', 'stateRevision'];
export const BLOCKER_KEYS = ['code', 'message', 'source'];
export const LAST_RESULT_KEYS = ['classification', 'runId', 'completedAt'];

export const ATTEMPT_DIR_PATTERN = /^attempt-(\d+)$/;
export const TASK_ID_PATTERN = /^TASK-[A-Z0-9][A-Z0-9_-]*$/;
export const NUMERIC_TASK_ID_PATTERN = /^TASK-(0*[1-9][0-9]*)$/;
export const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;

export const READY_STATUSES = new Set(['pending', 'interrupted', 'failed_retryable']);
export const TASK_STATUSES = new Set([
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
export const EXECUTION_STATUSES = new Set([
  'initialized',
  'active',
  'paused',
  'completed',
  'failed',
]);

export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 1;
}

export function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function isDateTimeOrNull(value) {
  return value === null
    || (typeof value === 'string'
      && value.trim() !== ''
      && !Number.isNaN(Date.parse(value)));
}

export function sameKeys(value, expectedKeys) {
  return isObject(value) && JSON.stringify(Object.keys(value)) === JSON.stringify(expectedKeys);
}

export function issue(code, source, message, reference = null) {
  return { code, source, message, reference };
}

export function pushUniqueIssue(collection, entry) {
  const signature = `${entry.code}\u0000${entry.source}\u0000${entry.reference ?? ''}`;
  if (!collection.some(
    (existing) => `${existing.code}\u0000${existing.source}\u0000${existing.reference ?? ''}` === signature,
  )) {
    collection.push(entry);
  }
}

function requireObject(parent, key, source, inputIssues, reference = key) {
  const value = parent?.[key];
  if (!isObject(value)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference} debe ser un objeto.`, reference));
    return null;
  }
  return value;
}

function requireArray(parent, key, source, inputIssues, reference = key) {
  const value = parent?.[key];
  if (!Array.isArray(value)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference} debe ser un arreglo.`, reference));
    return [];
  }
  return value;
}

export async function loadJson(root, relativePath, inputIssues, { required = true } = {}) {
  const absolutePath = path.join(root, relativePath);
  let raw;

  try {
    raw = await readFile(absolutePath, 'utf8');
  } catch (error) {
    if (required) {
      pushUniqueIssue(
        inputIssues,
        issue('REQUIRED_FILE_MISSING', relativePath, `No existe el archivo obligatorio ${relativePath}.`, null),
      );
    }
    return { raw: null, value: null };
  }

  try {
    const value = JSON.parse(raw);
    if (!isObject(value)) {
      pushUniqueIssue(
        inputIssues,
        issue('DOCUMENT_ROOT_INVALID', relativePath, 'La raíz del documento debe ser un objeto JSON.', null),
      );
      return { raw, value: null };
    }
    return { raw, value };
  } catch (error) {
    pushUniqueIssue(
      inputIssues,
      issue('JSON_INVALID', relativePath, `El archivo no contiene JSON válido: ${error.message}`, null),
    );
    return { raw, value: null };
  }
}

export function attemptDirectoryName(attempt) {
  return `attempt-${String(attempt).padStart(2, '0')}`;
}

export function runPathFor(taskId, attempt) {
  return path.posix.join('.devflow', 'execution', 'runs', taskId, attemptDirectoryName(attempt));
}

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

export function artifactDigest(document) {
  const clone = structuredClone(document);
  if (isObject(clone.timestamps)) delete clone.timestamps.contentHash;
  const serialized = JSON.stringify(canonical(clone));
  return `sha256:${createHash('sha256').update(serialized).digest('hex')}`;
}

export function taskNumericId(taskId) {
  if (typeof taskId !== 'string') return null;
  const match = NUMERIC_TASK_ID_PATTERN.exec(taskId);
  if (!match) return null;
  return BigInt(match[1]);
}

export function taskIdentityKey(taskId) {
  if (typeof taskId !== 'string' || !TASK_ID_PATTERN.test(taskId)) return null;
  const numeric = taskNumericId(taskId);
  return numeric === null ? `id:${taskId}` : `number:${numeric.toString()}`;
}

export function compareTaskIds(left, right) {
  const leftValue = taskNumericId(left);
  const rightValue = taskNumericId(right);
  if (leftValue === null && rightValue === null) return String(left).localeCompare(String(right));
  if (leftValue === null) return 1;
  if (rightValue === null) return -1;
  if (leftValue < rightValue) return -1;
  if (leftValue > rightValue) return 1;
  return String(left).localeCompare(String(right));
}

export function validateTaskCollection(records, source, field, inputIssues) {
  const exactIds = new Set();
  const identityOwners = new Map();
  const valid = [];

  for (const [index, record] of records.entries()) {
    const reference = `${field}[${index}]`;
    if (!isObject(record)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference} debe ser un objeto.`, reference));
      continue;
    }

    const id = record.id ?? record.taskId;
    const identityKey = taskIdentityKey(id);
    if (identityKey === null) {
      pushUniqueIssue(
        inputIssues,
        issue('TASK_ID_INVALID', source, `${reference} tiene un identificador de tarea inválido.`, reference),
      );
      continue;
    }

    if (exactIds.has(id)) {
      pushUniqueIssue(inputIssues, issue('TASK_ID_DUPLICATED', source, `${id} aparece más de una vez.`, id));
      continue;
    }
    exactIds.add(id);

    const previous = identityOwners.get(identityKey);
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
    identityOwners.set(identityKey, id);
    valid.push(record);
  }

  return { valid, identityOwners };
}

export function validateExecutionStateShape(executionState, inputIssues) {
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
    }

    if (!(entry.lastResult === null || isObject(entry.lastResult))) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.lastResult debe ser null u objeto.`, reference));
    } else if (isObject(entry.lastResult)) {
      if (!sameKeys(entry.lastResult, LAST_RESULT_KEYS)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.lastResult no conserva la estructura contractual.`, reference));
      }
    }

    if (!isDateTimeOrNull(entry.updatedAt)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.updatedAt debe ser null o date-time válido.`, reference));
    }
  }

  return taskRecords;
}
