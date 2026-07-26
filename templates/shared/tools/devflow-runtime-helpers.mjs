import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const CONTRACT_VERSION = '2.0';
export const EXECUTION_STATE_SCHEMA_VERSION = 2;
export const LEGACY_EXECUTION_STATE_SCHEMA_VERSION = 1;
export const EXECUTION_ENGINE_NAME = 'devflow-execution';
export const EXECUTION_ENGINE_CONTRACT_VERSION = '2.0';
export const LEGACY_EXECUTION_ENGINE_NAME = 'next-task';
export const LEGACY_EXECUTION_ENGINE_CONTRACT_VERSION = '1.0';

export const FILES = {
  projectState: '.devflow/task-planner/project-state.json',
  readiness: '.devflow/task-planner/readiness.json',
  epicPlan: '.devflow/task-planner/epic-plan.json',
  taskPlan: '.devflow/task-planner/task-plan.json',
  capabilityMap: '.devflow/task-planner/capability-map.json',
  executionState: '.devflow/execution/execution-state.json',
  selection: '.devflow/execution/selection.json',
  executionSchema: '.devflow/execution/execution-state.schema.json',
  journalSchema: '.devflow/execution/transition-journal.schema.json',
  selectionSchema: '.devflow/execution/task-selection.schema.json',
  runsRoot: '.devflow/execution/runs',
};

export const EXECUTION_ENGINE_FILES = {
  lock: '.devflow/execution/lock',
  journal: '.devflow/execution/transition-journal.json',
};

export const NEXT_TASK_RUNTIME_FILES = [
  FILES.selection,
  FILES.selectionSchema,
  '.devflow/execution/tools/select-next-task.mjs',
  '.devflow/execution/tools/validate-next-task.mjs',
  '.devflow/shared/tools/devflow-runtime-helpers.mjs',
];

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
export const LOCK_METADATA_KEYS = ['pid', 'host', 'createdAtMs'];
export const TRANSITION_JOURNAL_KEYS = [
  'schemaVersion',
  'transitionType',
  'taskId',
  'attempt',
  'runPath',
  'expectedRevision',
  'targetRevision',
  'selectionDigest',
  'phase',
  'officialTimestamp',
  'expectedArtifacts',
  'createdAt',
];
export const SELECTION_REQUIRED_KEYS = [
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
export const SELECTION_SOURCE_SNAPSHOT_KEYS = [
  'planningVersion',
  'epicPlanContentHash',
  'taskPlanContentHash',
  'capabilityMapContentHash',
  'executionStateRevision',
];
export const SELECTION_REASON_KEYS = [
  'dependenciesCompleted',
  'attemptsAvailable',
  'taskStatus',
  'readyTaskCount',
  'unlocksTaskIds',
  'tieBreaker',
];
export const ISSUE_KEYS = ['code', 'source', 'message', 'reference'];

export const ROOT_KEYS = SELECTION_REQUIRED_KEYS;
export const SNAPSHOT_KEYS = SELECTION_SOURCE_SNAPSHOT_KEYS;
export const REASON_KEYS = SELECTION_REASON_KEYS;
export const CLASSIFICATIONS = new Set([
  'NOT_EVALUATED',
  'TASK_SELECTED',
  'NO_READY_TASK',
  'PLAN_NOT_READY',
  'INPUT_INVALID',
  'STATE_CONFLICT',
]);

export const ATTEMPT_DIR_PATTERN = /^attempt-(\d+)$/;
export const TASK_ID_PATTERN = /^TASK-[A-Z0-9][A-Z0-9_-]*$/;
export const EPIC_ID_PATTERN = /^(?:EPIC|EPC)-[A-Z0-9][A-Z0-9_-]*$/;
export const NUMERIC_TASK_ID_PATTERN = /^TASK-(0*[1-9][0-9]*)$/;
export const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
export const TASK_SELECTED_CLASSIFICATION = 'TASK_SELECTED';
export const JOURNAL_TRANSITION_TYPE = 'prepare-task-run';
export const JOURNAL_PHASES = new Set(['started']);
export const RUN_TOKEN_PATTERN = new RegExp(`^${FILES.runsRoot.replace(/\//g, '\\/')}/([^/]+)/attempt-(\\d+)$`);

export const READY_STATUSES = new Set(['pending', 'interrupted', 'failed_retryable']);
export const ACTIVE_RUN_STATUSES = new Set(['running', 'waiting_human', 'waiting_external']);
export const ACTIVE_STATUSES = new Set(['reserved', ...ACTIVE_RUN_STATUSES]);
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

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
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

export function requireObject(parent, key, source, inputIssues, reference = key) {
  const value = parent?.[key];
  if (!isObject(value)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference} debe ser un objeto.`, reference));
    return null;
  }
  return value;
}

export function requireArray(parent, key, source, inputIssues, reference = key) {
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
  return path.posix.join(FILES.runsRoot, taskId, attemptDirectoryName(attempt));
}

export function isCanonicalTaskId(taskId) {
  return typeof taskId === 'string'
    && TASK_ID_PATTERN.test(taskId)
    && !taskId.includes('..')
    && !/[\\/]/.test(taskId)
    && !/[\u0000-\u001f\u007f\s]/.test(taskId);
}

export function isCanonicalRunToken(token) {
  if (typeof token !== 'string' || token.trim() === '') return false;
  const match = RUN_TOKEN_PATTERN.exec(token);
  if (!match) return false;
  return isCanonicalTaskId(match[1]) && isPositiveInteger(Number.parseInt(match[2], 10));
}

export function isWithinDirectory(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function resolveCanonicalRunContext(root, taskId, attempt) {
  if (!isCanonicalTaskId(taskId)) {
    throw new Error('taskId inválido para resolver runPath canónico.');
  }
  if (!isPositiveInteger(attempt)) {
    throw new Error('attempt inválido para resolver runPath canónico.');
  }

  const runsRootAbsolute = path.resolve(root, FILES.runsRoot);
  const runPath = runPathFor(taskId, attempt);
  const runDirectory = path.resolve(root, runPath);

  if (!isWithinDirectory(runsRootAbsolute, runDirectory)) {
    throw new Error('El runPath resuelto escapa del directorio autorizado de runs.');
  }

  return {
    runsRootAbsolute,
    runPath,
    runDirectory,
    selectionPath: path.resolve(runDirectory, 'selection.json'),
  };
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

export function validateEpicCollection(records, source, inputIssues) {
  const seen = new Set();
  const valid = [];

  for (const [index, record] of records.entries()) {
    const reference = `epics[${index}]`;
    if (!isObject(record)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference} debe ser un objeto.`, reference));
      continue;
    }

    if (typeof record.id !== 'string' || !EPIC_ID_PATTERN.test(record.id)) {
      pushUniqueIssue(inputIssues, issue('EPIC_ID_INVALID', source, `${reference}.id es inválido.`, reference));
      continue;
    }

    if (seen.has(record.id)) {
      pushUniqueIssue(inputIssues, issue('EPIC_ID_DUPLICATED', source, `${record.id} aparece más de una vez.`, record.id));
      continue;
    }
    seen.add(record.id);

    if (!isPositiveInteger(record.executionWave)) {
      pushUniqueIssue(
        inputIssues,
        issue('FIELD_INVALID', source, `${record.id}.executionWave debe ser un entero positivo.`, record.id),
      );
      continue;
    }

    valid.push(record);
  }

  return valid;
}

export function validateContentHash(document, source, inputIssues, { required = false } = {}) {
  const timestamps = requireObject(document, 'timestamps', source, inputIssues, 'timestamps');
  if (!timestamps) return;

  const hash = timestamps.contentHash ?? null;
  if (hash === null && required) {
    pushUniqueIssue(
      inputIssues,
      issue('CONTENT_HASH_MISSING', source, `${source} requiere timestamps.contentHash para este estado.`, 'timestamps.contentHash'),
    );
    return;
  }

  if (hash !== null && !HASH_PATTERN.test(hash)) {
    pushUniqueIssue(
      inputIssues,
      issue('FIELD_INVALID', source, `${source}.timestamps.contentHash debe ser un digest sha256 canónico.`, 'timestamps.contentHash'),
    );
  }
}

export function findTaskCycle(tasks) {
  const graph = new Map(tasks.map((task) => [task.id, Array.isArray(task.dependencyIds) ? task.dependencyIds : []]));
  const visiting = new Set();
  const visited = new Set();
  const trail = [];

  function visit(taskId) {
    if (visiting.has(taskId)) {
      const start = trail.indexOf(taskId);
      return start === -1 ? [taskId] : [...trail.slice(start), taskId];
    }
    if (visited.has(taskId)) return null;

    visiting.add(taskId);
    trail.push(taskId);

    for (const dependencyId of graph.get(taskId) ?? []) {
      if (!graph.has(dependencyId)) continue;
      const cycle = visit(dependencyId);
      if (cycle) return cycle;
    }

    trail.pop();
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

export function validateExecutionStateShape(executionState, inputIssues) {
  const source = FILES.executionState;
  if (!executionState) return [];

  if (!sameKeys(executionState, EXECUTION_ROOT_KEYS)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'La raíz no conserva exactamente la estructura contractual.', null));
  }

  const isLegacyVersion = executionState.schemaVersion === LEGACY_EXECUTION_STATE_SCHEMA_VERSION;
  if (isLegacyVersion) {
    pushUniqueIssue(
      inputIssues,
      issue(
        'EXECUTION_STATE_VERSION_UNSUPPORTED',
        source,
        'El estado usa schemaVersion 1. Ejecuta migrate-execution-state-v1-to-v2.mjs antes de usar este runtime.',
        'schemaVersion',
      ),
    );
  } else if (executionState.schemaVersion !== EXECUTION_STATE_SCHEMA_VERSION) {
    pushUniqueIssue(
      inputIssues,
      issue('FIELD_INVALID', source, `schemaVersion debe ser ${EXECUTION_STATE_SCHEMA_VERSION}.`, 'schemaVersion'),
    );
  }

  const engine = requireObject(executionState, 'engine', source, inputIssues);
  if (engine) {
    if (!sameKeys(engine, ENGINE_KEYS)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'engine no conserva la estructura contractual.', 'engine'));
    }

    if (isLegacyVersion) {
      if (engine.name !== LEGACY_EXECUTION_ENGINE_NAME
        || engine.contractVersion !== LEGACY_EXECUTION_ENGINE_CONTRACT_VERSION) {
        pushUniqueIssue(
          inputIssues,
          issue('FIELD_INVALID', source, 'engine no coincide con el contrato legacy esperado.', 'engine'),
        );
      }
    } else {
      if (engine.name !== EXECUTION_ENGINE_NAME) {
        pushUniqueIssue(
          inputIssues,
          issue('FIELD_INVALID', source, `engine.name debe ser ${EXECUTION_ENGINE_NAME}.`, 'engine.name'),
        );
      }
      if (engine.contractVersion !== EXECUTION_ENGINE_CONTRACT_VERSION) {
        pushUniqueIssue(
          inputIssues,
          issue('FIELD_INVALID', source, `engine.contractVersion debe ser ${EXECUTION_ENGINE_CONTRACT_VERSION}.`, 'engine.contractVersion'),
        );
      }
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
    if (!(entry.activeRunId === null || isCanonicalRunToken(entry.activeRunId))) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.activeRunId debe ser null o un run token canónico.`, reference));
    }

    if (!(entry.reservation === null || isObject(entry.reservation))) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.reservation debe ser null u objeto.`, reference));
    } else if (isObject(entry.reservation)) {
      if (!sameKeys(entry.reservation, RESERVATION_KEYS)) {
        pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, `${reference}.reservation no conserva la estructura contractual.`, reference));
      }
      if (!isCanonicalRunToken(entry.reservation.token)) {
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

    if (entry.status === 'reserved') {
      if (entry.reservation === null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} está reserved sin reservation.`, reference));
      }
      if (entry.activeRunId !== null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} está reserved con activeRunId.`, reference));
      }
      if (entry.blocker !== null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} está reserved con blocker.`, reference));
      }
    }

    if (ACTIVE_RUN_STATUSES.has(entry.status)) {
      if (entry.activeRunId === null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} tiene un estado activo sin activeRunId.`, reference));
      }
      if (entry.reservation !== null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} tiene reservation activa en un estado activo.`, reference));
      }
      if (entry.blocker !== null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} tiene blocker en un estado activo.`, reference));
      }
    }

    if (entry.status === 'blocked') {
      if (entry.blocker === null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} está blocked sin blocker.`, reference));
      }
      if (entry.activeRunId !== null || entry.reservation !== null) {
        pushUniqueIssue(inputIssues, issue('TASK_STATE_INCONSISTENT', source, `${reference} está blocked con run o reserva persistidos.`, reference));
      }
    }

    if (['pending', 'interrupted', 'completed', 'failed_retryable', 'failed_permanent', 'cancelled'].includes(entry.status)
      && (entry.activeRunId !== null || entry.reservation !== null || entry.blocker !== null)) {
      pushUniqueIssue(
        inputIssues,
        issue('TASK_STATE_INCONSISTENT', source, `${reference} tiene run, reserva o blocker incompatibles con su estado.`, reference),
      );
    }
  }

  return taskRecords;
}

export function validateSelectionForPreparation(selection, source, inputIssues) {
  if (!isObject(selection)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'La selección debe ser un objeto JSON.', null));
    return;
  }

  if (!sameKeys(selection, SELECTION_REQUIRED_KEYS)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'La selección no conserva la estructura contractual.', null));
  }

  if (selection.schemaVersion !== 1) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'selection.schemaVersion debe ser 1.', 'schemaVersion'));
  }

  if (selection.classification !== TASK_SELECTED_CLASSIFICATION) {
    pushUniqueIssue(
      inputIssues,
      issue('FIELD_INVALID', source, `classification debe ser ${TASK_SELECTED_CLASSIFICATION}.`, 'classification'),
    );
  }

  if (!isCanonicalTaskId(selection.selectedTaskId)) {
    pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'selectedTaskId no cumple el patrón canónico permitido.', 'selectedTaskId'));
  }

  const sourceSnapshot = requireObject(selection, 'sourceSnapshot', source, inputIssues);
  if (sourceSnapshot) {
    if (!sameKeys(sourceSnapshot, SELECTION_SOURCE_SNAPSHOT_KEYS)) {
      pushUniqueIssue(inputIssues, issue('FIELD_INVALID', source, 'sourceSnapshot no conserva la estructura contractual.', 'sourceSnapshot'));
    }
    if (!isNonNegativeInteger(sourceSnapshot.executionStateRevision)) {
      pushUniqueIssue(
        inputIssues,
        issue('FIELD_INVALID', source, 'sourceSnapshot.executionStateRevision debe ser un entero no negativo.', 'sourceSnapshot.executionStateRevision'),
      );
    }
  }
}

export function validateTransitionJournal(journal, { root, source = EXECUTION_ENGINE_FILES.journal } = {}) {
  const issues = [];

  if (!isObject(journal)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'El journal debe ser un objeto JSON.', null));
    return { ok: false, issues, runContext: null };
  }

  if (!sameKeys(journal, TRANSITION_JOURNAL_KEYS)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'El journal no conserva exactamente la estructura contractual.', null));
  }

  if (journal.schemaVersion !== 1) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'schemaVersion del journal debe ser 1.', 'schemaVersion'));
  }
  if (journal.transitionType !== JOURNAL_TRANSITION_TYPE) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, `transitionType debe ser ${JOURNAL_TRANSITION_TYPE}.`, 'transitionType'));
  }
  if (!isCanonicalTaskId(journal.taskId)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'taskId del journal no cumple el patrón canónico permitido.', 'taskId'));
  }
  if (!isPositiveInteger(journal.attempt)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'attempt del journal debe ser un entero positivo.', 'attempt'));
  }
  if (!isNonNegativeInteger(journal.expectedRevision)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'expectedRevision debe ser un entero no negativo.', 'expectedRevision'));
  }
  if (!isNonNegativeInteger(journal.targetRevision)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'targetRevision debe ser un entero no negativo.', 'targetRevision'));
  }
  if (isNonNegativeInteger(journal.expectedRevision)
    && isNonNegativeInteger(journal.targetRevision)
    && journal.targetRevision !== journal.expectedRevision + 1) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'targetRevision debe ser expectedRevision + 1.', 'targetRevision'));
  }
  if (!HASH_PATTERN.test(journal.selectionDigest)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'selectionDigest debe ser un digest sha256 canónico.', 'selectionDigest'));
  }
  if (!JOURNAL_PHASES.has(journal.phase)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'phase del journal no está permitida.', 'phase'));
  }
  if (!isDateTimeOrNull(journal.officialTimestamp) || journal.officialTimestamp === null) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'officialTimestamp debe ser date-time válido.', 'officialTimestamp'));
  }
  if (!isDateTimeOrNull(journal.createdAt) || journal.createdAt === null) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'createdAt debe ser date-time válido.', 'createdAt'));
  }

  let runContext = null;
  if (root && isCanonicalTaskId(journal.taskId) && isPositiveInteger(journal.attempt)) {
    try {
      runContext = resolveCanonicalRunContext(root, journal.taskId, journal.attempt);
      if (journal.runPath !== runContext.runPath) {
        pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'runPath no coincide con el path canónico derivado.', 'runPath'));
      }
    } catch (error) {
      pushUniqueIssue(issues, issue('FIELD_INVALID', source, error.message, 'runPath'));
    }
  } else if (!isNonEmptyString(journal.runPath)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'runPath debe ser un string no vacío.', 'runPath'));
  }

  const expectedArtifacts = runContext
    ? [
        `${runContext.runPath}/selection.json`,
        FILES.executionState,
      ]
    : null;
  if (!Array.isArray(journal.expectedArtifacts)) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'expectedArtifacts debe ser un arreglo.', 'expectedArtifacts'));
  } else if (!expectedArtifacts
    || journal.expectedArtifacts.length !== expectedArtifacts.length
    || journal.expectedArtifacts.some((entry, index) => entry !== expectedArtifacts[index])) {
    pushUniqueIssue(issues, issue('FIELD_INVALID', source, 'expectedArtifacts debe coincidir exactamente con los artefactos canónicos.', 'expectedArtifacts'));
  }

  return { ok: issues.length === 0, issues, runContext };
}

export function migrateExecutionStateDocument(document) {
  if (!isObject(document)) {
    throw new Error('execution-state.json debe ser un objeto JSON.');
  }

  if (document.schemaVersion === EXECUTION_STATE_SCHEMA_VERSION) {
    if (document.engine?.name !== EXECUTION_ENGINE_NAME
      || document.engine?.contractVersion !== EXECUTION_ENGINE_CONTRACT_VERSION) {
      throw new Error('El documento ya usa schemaVersion 2 pero engine no coincide con el contrato actual.');
    }
    return structuredClone(document);
  }

  if (document.schemaVersion !== LEGACY_EXECUTION_STATE_SCHEMA_VERSION) {
    throw new Error(`Solo se admite migrar schemaVersion ${LEGACY_EXECUTION_STATE_SCHEMA_VERSION}.`);
  }

  if (document.engine?.name !== LEGACY_EXECUTION_ENGINE_NAME
    || document.engine?.contractVersion !== LEGACY_EXECUTION_ENGINE_CONTRACT_VERSION) {
    throw new Error('El documento legacy no pertenece al contrato next-task esperado.');
  }

  const migrated = structuredClone(document);
  migrated.schemaVersion = EXECUTION_STATE_SCHEMA_VERSION;
  migrated.engine = {
    name: EXECUTION_ENGINE_NAME,
    contractVersion: EXECUTION_ENGINE_CONTRACT_VERSION,
  };
  return migrated;
}
