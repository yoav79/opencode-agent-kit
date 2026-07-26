import { createHash } from 'node:crypto';
import { mkdir, open, opendir, readFile, rename, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  isObject,
  isPositiveInteger,
  isNonNegativeInteger,
  loadJson,
  validateExecutionStateShape,
  validateTaskCollection,
  validateSelectionForPreparation,
  validateTransitionJournal,
  FILES,
  EXECUTION_ENGINE_FILES,
  READY_STATUSES,
  ATTEMPT_DIR_PATTERN,
  TASK_SELECTED_CLASSIFICATION,
  attemptDirectoryName,
  resolveCanonicalRunContext,
  runPathFor,
} from './execution-contract-helpers.mjs';

const TRANSITION_TYPE = 'prepare-task-run';
const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'failed_permanent']);
const LOCK_METADATA_FILE = 'owner.json';
const ENGINE_CLASSIFICATIONS = {
  RUN_PREPARED: 'RUN_PREPARED',
  IDEMPOTENT: 'IDEMPOTENT',
  RECOVERED: 'RECOVERED',
  STALE_SELECTION: 'STALE_SELECTION',
  SELECTION_INVALID: 'SELECTION_INVALID',
  RUN_CONFLICT: 'RUN_CONFLICT',
  EXECUTION_STATE_INVALID: 'EXECUTION_STATE_INVALID',
  JOURNAL_INVALID: 'JOURNAL_INVALID',
  JOURNAL_CONFLICT: 'JOURNAL_CONFLICT',
  LOCK_INVALID: 'LOCK_INVALID',
  LOCK_FAILED: 'LOCK_FAILED',
  LOCK_TIMEOUT: 'LOCK_TIMEOUT',
};
const STABLE_RESULT_CODES = new Set([
  ENGINE_CLASSIFICATIONS.SELECTION_INVALID,
  ENGINE_CLASSIFICATIONS.STALE_SELECTION,
  ENGINE_CLASSIFICATIONS.RUN_CONFLICT,
  ENGINE_CLASSIFICATIONS.EXECUTION_STATE_INVALID,
  ENGINE_CLASSIFICATIONS.JOURNAL_INVALID,
  ENGINE_CLASSIFICATIONS.JOURNAL_CONFLICT,
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function nowIso() {
  if (process.env.NODE_ENV === 'test' && process.env.TIMESTAMP_TOOL_TEST_NOW) {
    return process.env.TIMESTAMP_TOOL_TEST_NOW;
  }
  return new Date().toISOString();
}

function result(classification, fields = {}) {
  return {
    classification,
    taskId: fields.taskId ?? null,
    attempt: fields.attempt ?? null,
    runPath: fields.runPath ?? null,
    previousRevision: fields.previousRevision ?? null,
    newRevision: fields.newRevision ?? null,
    recovered: fields.recovered ?? false,
    idempotent: classification === ENGINE_CLASSIFICATIONS.IDEMPOTENT ? true : (fields.idempotent ?? false),
  };
}

class EngineError extends Error {
  constructor(code, message, fields = {}) {
    super(message);
    this.code = code;
    this.fields = fields;
    this.name = 'EngineError';
  }
}

class CrashSimulationError extends Error {
  constructor(point) {
    super(`Simulated crash at: ${point}`);
    this.name = 'CrashSimulationError';
    this.faultPoint = point;
  }
}

const FAULT_POINTS = {
  AFTER_JOURNAL: 'AFTER_JOURNAL',
  AFTER_EVIDENCE: 'AFTER_EVIDENCE',
  AFTER_STATE: 'AFTER_STATE',
  BEFORE_CLEANUP: 'BEFORE_CLEANUP',
};

function injectFault(point) {
  if (process.env.NODE_ENV !== 'test') return;
  const envKey = `FAULT_INJECT_${point}`;
  if (process.env[envKey] === '1' || process.env[envKey] === 'true') {
    throw new CrashSimulationError(point);
  }
}

function computeDigest(raw) {
  return `sha256:${createHash('sha256').update(raw, 'utf8').digest('hex')}`;
}

async function writeAtomicText(filePath, content) {
  const tmpPath = `${filePath}.tmp`;
  let handle;

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    handle = await open(tmpPath, 'w');
    await handle.writeFile(content, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tmpPath, filePath);
  } catch (error) {
    if (handle) {
      await handle.close().catch(() => {});
    }
    await rm(tmpPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function readFileSafe(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function dirExists(dirPath) {
  try {
    const s = await stat(dirPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function writeLockMetadata(lockDir, metadata) {
  await writeAtomicText(
    path.join(lockDir, LOCK_METADATA_FILE),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
}

function validateLockMetadataShape(value) {
  return isObject(value)
    && Number.isInteger(value.pid)
    && value.pid > 0
    && typeof value.host === 'string'
    && value.host.trim() !== ''
    && Number.isInteger(value.createdAtMs)
    && value.createdAtMs >= 0
    && JSON.stringify(Object.keys(value)) === JSON.stringify(['pid', 'host', 'createdAtMs']);
}

async function inspectExistingLock(lockDir, localHost, initializationGraceMs) {
  let createdAtMs = null;
  try {
    const s = await stat(lockDir);
    createdAtMs = s.mtimeMs;
  } catch {
    return { status: 'MISSING' };
  }

  const ageMs = Math.max(0, Date.now() - Math.floor(createdAtMs ?? Date.now()));
  const metadataRaw = await readFileSafe(path.join(lockDir, LOCK_METADATA_FILE));
  if (metadataRaw === null) {
    if (ageMs < initializationGraceMs) {
      return { status: 'INITIALIZING' };
    }
    return { status: 'INVALID', message: 'El lock existe pero no completó su metadata atómica.' };
  }

  let metadata;
  try {
    metadata = JSON.parse(metadataRaw);
  } catch (error) {
    return { status: 'INVALID', message: `La metadata del lock no contiene JSON válido: ${error.message}` };
  }

  if (!validateLockMetadataShape(metadata)) {
    return { status: 'INVALID', message: 'La metadata del lock no cumple la estructura contractual.' };
  }

  if (metadata.host !== localHost) {
    return { status: 'BUSY_REMOTE', metadata };
  }

  try {
    process.kill(metadata.pid, 0);
    return { status: 'BUSY_LOCAL', metadata };
  } catch (error) {
    if (error?.code === 'EPERM') {
      return { status: 'BUSY_LOCAL', metadata };
    }
    return { status: 'STALE_LOCAL', metadata };
  }
}

async function acquireLock(root) {
  const lockDir = path.join(root, EXECUTION_ENGINE_FILES.lock);
  const pid = process.pid;
  const host = os.hostname();
  const lockTimeoutMs = Number.parseInt(process.env.LOCK_TIMEOUT_MS, 10) || 30000;
  const lockRetryMs = Number.parseInt(process.env.LOCK_RETRY_MS, 10) || 200;
  const initializationGraceMs = Number.parseInt(process.env.LOCK_INIT_GRACE_MS, 10) || 1000;
  const deadline = Date.now() + lockTimeoutMs;

  while (Date.now() < deadline) {
    try {
      await mkdir(lockDir);
      try {
        await writeLockMetadata(lockDir, {
          pid,
          host,
          createdAtMs: Date.now(),
        });
        return lockDir;
      } catch (error) {
        await rm(lockDir, { recursive: true, force: true }).catch(() => {});
        throw new EngineError(ENGINE_CLASSIFICATIONS.LOCK_FAILED, `Error al completar la metadata del lock: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof EngineError) throw err;
      if (err.code !== 'EEXIST') {
        throw new EngineError(ENGINE_CLASSIFICATIONS.LOCK_FAILED, `Error al adquirir lock: ${err.message}`);
      }

      const lockStatus = await inspectExistingLock(lockDir, host, initializationGraceMs);
      if (lockStatus.status === 'MISSING' || lockStatus.status === 'STALE_LOCAL') {
        await rm(lockDir, { recursive: true, force: true }).catch(() => {});
        continue;
      }
      if (lockStatus.status === 'INVALID') {
        throw new EngineError(ENGINE_CLASSIFICATIONS.LOCK_INVALID, lockStatus.message);
      }

      await sleep(lockRetryMs);
    }
  }

  throw new EngineError(ENGINE_CLASSIFICATIONS.LOCK_TIMEOUT, `No se pudo adquirir el lock en ${lockTimeoutMs}ms.`);
}

async function releaseLock(lockDir) {
  try {
    await rm(lockDir, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

async function loadAndValidateSelection(root) {
  const issues = [];
  const loaded = await loadJson(root, FILES.selection, issues, { required: true });

  if (loaded.raw === null || !loaded.value) {
    return result(ENGINE_CLASSIFICATIONS.SELECTION_INVALID);
  }

  validateSelectionForPreparation(loaded.value, FILES.selection, issues);
  if (issues.length > 0) {
    return result(ENGINE_CLASSIFICATIONS.SELECTION_INVALID, {
      taskId: typeof loaded.value.selectedTaskId === 'string' ? loaded.value.selectedTaskId : null,
    });
  }

  return {
    selection: loaded.value,
    selectionRaw: loaded.raw,
    selectionDigest: computeDigest(loaded.raw),
  };
}

async function validateStateUnderLock(root) {
  const issues = [];
  const loaded = await loadJson(root, FILES.executionState, issues, { required: true });

  if (loaded.raw === null || !loaded.value) {
    throw new EngineError(ENGINE_CLASSIFICATIONS.EXECUTION_STATE_INVALID, `No se pudo leer ${FILES.executionState}.`);
  }

  const taskRecords = validateExecutionStateShape(loaded.value, issues);
  const validation = validateTaskCollection(taskRecords, FILES.executionState, 'tasks', issues);

  if (issues.length > 0) {
    throw new EngineError(ENGINE_CLASSIFICATIONS.EXECUTION_STATE_INVALID, issues.map((entry) => entry.code).join(', '));
  }

  return { state: loaded.value, tasks: validation.valid };
}

async function resolveAttempt(root, taskId, explicitAttempt) {
  if (explicitAttempt !== null) return explicitAttempt;

  const taskRunsDir = path.join(root, FILES.runsRoot, taskId);
  let maxAttempt = 0;

  let dir;
  try {
    dir = await opendir(taskRunsDir);
  } catch (err) {
    if (err.code === 'ENOENT') return 1;
    throw err;
  }

  for await (const entry of dir) {
    if (!entry.isDirectory()) continue;
    const match = ATTEMPT_DIR_PATTERN.exec(entry.name);
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    if (Number.isInteger(value) && value > maxAttempt) maxAttempt = value;
  }

  return maxAttempt === 0 ? 1 : maxAttempt + 1;
}

function findTaskById(tasks, taskId) {
  return tasks.find((entry) => entry.taskId === taskId) ?? null;
}

function buildReservedTask(existingTask, taskId, policy, reservation) {
  return {
    taskId,
    status: 'reserved',
    attemptCount: existingTask?.attemptCount ?? 0,
    maxAttempts: existingTask?.maxAttempts ?? policy.defaultMaxAttempts,
    activeRunId: null,
    reservation,
    blocker: null,
    lastResult: existingTask?.lastResult ?? null,
    updatedAt: null,
  };
}

function assertReservable(existingTask) {
  if (!existingTask) return;

  if (!READY_STATUSES.has(existingTask.status)) {
    throw new EngineError(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, 'La tarea ya no está en un estado reservable.', {
      taskId: existingTask.taskId,
    });
  }

  if (existingTask.activeRunId !== null || existingTask.reservation !== null || existingTask.blocker !== null) {
    throw new EngineError(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, 'La tarea ya tiene un run activo, una reserva o un blocker persistido.', {
      taskId: existingTask.taskId,
    });
  }

  if (!isPositiveInteger(existingTask.maxAttempts) || !isNonNegativeInteger(existingTask.attemptCount)) {
    throw new EngineError(ENGINE_CLASSIFICATIONS.EXECUTION_STATE_INVALID, 'La tarea tiene un estado de intentos inválido.');
  }

  if (existingTask.attemptCount >= existingTask.maxAttempts) {
    throw new EngineError(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, 'La tarea agotó sus intentos disponibles.', {
      taskId: existingTask.taskId,
    });
  }
}

function produceNextState(state, updatedTask, taskId, newRevision, at) {
  const tasks = state.tasks.map((entry) => {
    if (entry.taskId === taskId) return updatedTask;
    return entry;
  });

  if (!tasks.some((entry) => entry.taskId === taskId)) {
    tasks.push(updatedTask);
  }

  return {
    schemaVersion: state.schemaVersion,
    engine: { ...state.engine },
    project: { ...state.project },
    revision: newRevision,
    status: state.status,
    policy: { ...state.policy },
    tasks,
    timestamps: {
      createdAt: state.timestamps?.createdAt ?? at,
      updatedAt: at,
    },
  };
}

function journalPath(root) {
  return path.join(root, EXECUTION_ENGINE_FILES.journal);
}

async function writeJournal(root, fields) {
  const runContext = resolveCanonicalRunContext(root, fields.taskId, fields.attempt);
  const entry = {
    schemaVersion: 1,
    transitionType: TRANSITION_TYPE,
    taskId: fields.taskId,
    attempt: fields.attempt,
    runPath: runContext.runPath,
    expectedRevision: fields.expectedRevision,
    targetRevision: fields.targetRevision,
    selectionDigest: fields.selectionDigest,
    phase: 'started',
    officialTimestamp: fields.officialTimestamp,
    expectedArtifacts: [
      `${runContext.runPath}/selection.json`,
      FILES.executionState,
    ],
    createdAt: fields.officialTimestamp,
  };

  const validation = validateTransitionJournal(entry, { root });
  if (!validation.ok) {
    throw new EngineError('WRITE_FAILED', 'El journal generado no cumple el contrato.');
  }

  await writeAtomicText(journalPath(root), `${JSON.stringify(entry, null, 2)}\n`);
  return entry;
}

async function readJournal(root) {
  const raw = await readFileSafe(journalPath(root));
  if (raw === null) {
    return { exists: false, raw: null, value: null, parseError: null };
  }

  try {
    const value = JSON.parse(raw);
    if (!isObject(value)) {
      return { exists: true, raw, value: null, parseError: 'La raíz del journal debe ser un objeto JSON.' };
    }
    return { exists: true, raw, value, parseError: null };
  } catch (error) {
    return { exists: true, raw, value: null, parseError: error.message };
  }
}

async function removeJournal(root) {
  try {
    await rm(journalPath(root), { force: true });
  } catch {
  }
}

async function cleanTempFiles(root, runContext = null) {
  await rm(`${path.join(root, FILES.executionState)}.tmp`, { force: true }).catch(() => {});
  await rm(`${journalPath(root)}.tmp`, { force: true }).catch(() => {});
  if (runContext) {
    await rm(`${runContext.selectionPath}.tmp`, { force: true }).catch(() => {});
  }
}

function exactReservationMatches(taskRecord, journal, stateRevision) {
  return taskRecord
    && taskRecord.status === 'reserved'
    && taskRecord.activeRunId === null
    && taskRecord.blocker === null
    && taskRecord.reservation !== null
    && taskRecord.reservation.token === journal.runPath
    && taskRecord.reservation.stateRevision === journal.expectedRevision
    && taskRecord.reservation.reservedAt === journal.officialTimestamp
    && stateRevision === journal.targetRevision;
}

function classifyRecoveryState(state, taskRecord, journal) {
  if (taskRecord && TERMINAL_STATUSES.has(taskRecord.status)) {
    return 'terminal';
  }

  if (exactReservationMatches(taskRecord, journal, state.revision)) {
    return 'exact_reserved';
  }

  if (state.revision !== journal.expectedRevision) {
    return 'revision_mismatch';
  }

  try {
    assertReservable(taskRecord);
    return 'reservable';
  } catch (error) {
    if (error instanceof EngineError && error.code === ENGINE_CLASSIFICATIONS.RUN_CONFLICT) {
      return 'occupied';
    }
    throw error;
  }
}

function inspectEvidence({ evidenceRaw, journal, selection, selectionRaw, selectionDigest }) {
  if (evidenceRaw === null) {
    return { status: 'missing' };
  }

  if (computeDigest(evidenceRaw) !== journal.selectionDigest) {
    return { status: 'invalid', reason: 'digest' };
  }

  let evidence;
  try {
    evidence = JSON.parse(evidenceRaw);
  } catch {
    return { status: 'invalid', reason: 'json' };
  }

  const issues = [];
  validateSelectionForPreparation(evidence, `${journal.runPath}/selection.json`, issues);
  if (issues.length > 0) {
    return { status: 'invalid', reason: 'shape' };
  }

  if (evidence.classification !== TASK_SELECTED_CLASSIFICATION
    || evidence.selectedTaskId !== journal.taskId
    || evidence.sourceSnapshot.executionStateRevision !== journal.expectedRevision) {
    return { status: 'invalid', reason: 'identity' };
  }

  if (selection.classification !== TASK_SELECTED_CLASSIFICATION
    || selection.selectedTaskId !== journal.taskId
    || selection.sourceSnapshot.executionStateRevision !== journal.expectedRevision
    || selectionDigest !== journal.selectionDigest
    || evidenceRaw !== selectionRaw) {
    return { status: 'invalid', reason: 'selection_mismatch' };
  }

  return { status: 'valid' };
}

function decideRecoveryAction({ evidenceStatus, stateStatus, selectionMatchesJournal }) {
  if (evidenceStatus === 'invalid') {
    return { type: 'result', classification: ENGINE_CLASSIFICATIONS.RUN_CONFLICT };
  }
  if (stateStatus === 'terminal') {
    return { type: 'result', classification: ENGINE_CLASSIFICATIONS.RUN_CONFLICT };
  }
  if (evidenceStatus === 'missing' && !selectionMatchesJournal) {
    return { type: 'result', classification: ENGINE_CLASSIFICATIONS.JOURNAL_CONFLICT };
  }
  if (evidenceStatus === 'missing' && stateStatus === 'reservable') {
    return { type: 'restart' };
  }
  if (evidenceStatus === 'valid' && stateStatus === 'reservable') {
    return { type: 'apply_state' };
  }
  if (evidenceStatus === 'valid' && stateStatus === 'exact_reserved') {
    return { type: 'idempotent' };
  }
  if (evidenceStatus === 'missing' && stateStatus === 'exact_reserved') {
    return { type: 'result', classification: ENGINE_CLASSIFICATIONS.JOURNAL_CONFLICT };
  }
  return { type: 'result', classification: ENGINE_CLASSIFICATIONS.JOURNAL_CONFLICT };
}

async function finalizeTransition(root, {
  runContext,
  selectionRaw,
  newState,
  writeEvidence,
  writeState,
}) {
  try {
    if (writeEvidence) {
      await mkdir(runContext.runDirectory, { recursive: true });
      await writeAtomicText(runContext.selectionPath, selectionRaw);
      injectFault(FAULT_POINTS.AFTER_EVIDENCE);
    }

    if (writeState) {
      await writeAtomicText(path.join(root, FILES.executionState), `${JSON.stringify(newState, null, 2)}\n`);
      injectFault(FAULT_POINTS.AFTER_STATE);
    }

    injectFault(FAULT_POINTS.BEFORE_CLEANUP);
    await removeJournal(root);
    await cleanTempFiles(root, runContext);
  } catch (writeError) {
    if (writeError instanceof CrashSimulationError) throw writeError;
    throw new EngineError('WRITE_FAILED', `Error durante escritura atómica: ${writeError.message}`);
  }
}

async function recoverFromJournal(root, {
  explicitAttempt,
  selection,
  selectionRaw,
  selectionDigest,
  state,
  tasks,
}) {
  const journalDocument = await readJournal(root);
  if (!journalDocument.exists) return null;

  if (journalDocument.parseError) {
    return {
      kind: 'result',
      report: result(ENGINE_CLASSIFICATIONS.JOURNAL_INVALID, {
        previousRevision: state.revision,
        newRevision: state.revision,
      }),
    };
  }

  const journal = journalDocument.value;
  const validation = validateTransitionJournal(journal, { root });
  if (!validation.ok) {
    return {
      kind: 'result',
      report: result(ENGINE_CLASSIFICATIONS.JOURNAL_INVALID, {
        taskId: journal.taskId ?? null,
        attempt: journal.attempt ?? null,
        runPath: typeof journal.runPath === 'string' ? journal.runPath : null,
        previousRevision: state.revision,
        newRevision: state.revision,
      }),
    };
  }

  if (explicitAttempt !== null && explicitAttempt !== journal.attempt) {
    return {
      kind: 'result',
      report: result(ENGINE_CLASSIFICATIONS.JOURNAL_CONFLICT, {
        taskId: journal.taskId,
        attempt: journal.attempt,
        runPath: journal.runPath,
        previousRevision: state.revision,
        newRevision: state.revision,
      }),
    };
  }

  const runContext = validation.runContext;
  const taskRecord = findTaskById(tasks, journal.taskId);
  const stateStatus = classifyRecoveryState(state, taskRecord, journal);
  const selectionMatchesJournal = selection.selectedTaskId === journal.taskId
    && selection.sourceSnapshot.executionStateRevision === journal.expectedRevision
    && selectionDigest === journal.selectionDigest;
  const evidenceRaw = await readFileSafe(runContext.selectionPath);
  const evidenceStatus = inspectEvidence({
    evidenceRaw,
    journal,
    selection,
    selectionRaw,
    selectionDigest,
  }).status;
  const action = decideRecoveryAction({ evidenceStatus, stateStatus, selectionMatchesJournal });

  if (action.type === 'result') {
    return {
      kind: 'result',
      report: result(action.classification, {
        taskId: journal.taskId,
        attempt: journal.attempt,
        runPath: journal.runPath,
        previousRevision: state.revision,
        newRevision: state.revision,
      }),
    };
  }

  if (action.type === 'idempotent') {
    await removeJournal(root);
    await cleanTempFiles(root, runContext);
    return {
      kind: 'result',
      report: result(ENGINE_CLASSIFICATIONS.IDEMPOTENT, {
        taskId: journal.taskId,
        attempt: journal.attempt,
        runPath: journal.runPath,
        previousRevision: state.revision,
        newRevision: state.revision,
        recovered: true,
      }),
    };
  }

  const at = journal.officialTimestamp;
  const reservation = {
    token: journal.runPath,
    reservedAt: at,
    stateRevision: journal.expectedRevision,
  };
  const updatedTask = buildReservedTask(taskRecord, journal.taskId, state.policy, reservation);
  const newState = produceNextState(state, updatedTask, journal.taskId, journal.targetRevision, at);

  if (action.type === 'restart') {
    await finalizeTransition(root, {
      runContext,
      selectionRaw,
      newState,
      writeEvidence: true,
      writeState: true,
    });
    return {
      kind: 'result',
      report: result(ENGINE_CLASSIFICATIONS.RECOVERED, {
        taskId: journal.taskId,
        attempt: journal.attempt,
        runPath: journal.runPath,
        previousRevision: state.revision,
        newRevision: journal.targetRevision,
        recovered: true,
      }),
    };
  }

  await finalizeTransition(root, {
    runContext,
    selectionRaw,
    newState,
    writeEvidence: false,
    writeState: true,
  });
  return {
    kind: 'result',
    report: result(ENGINE_CLASSIFICATIONS.RECOVERED, {
      taskId: journal.taskId,
      attempt: journal.attempt,
      runPath: journal.runPath,
      previousRevision: state.revision,
      newRevision: journal.targetRevision,
      recovered: true,
    }),
  };
}

function exactPreparedState(taskRecord, runPath, expectedRevision, targetRevision, stateRevision) {
  return taskRecord
    && taskRecord.status === 'reserved'
    && taskRecord.activeRunId === null
    && taskRecord.blocker === null
    && taskRecord.reservation !== null
    && taskRecord.reservation.token === runPath
    && taskRecord.reservation.stateRevision === expectedRevision
    && stateRevision === targetRevision;
}

export async function prepareTaskRun(options = {}) {
  const root = options.root || process.cwd();
  const explicitAttempt = options.attempt ?? null;
  const onTimestamp = options.onTimestamp || null;
  let lockDir = null;

  try {
    if (explicitAttempt !== null && !isPositiveInteger(explicitAttempt)) {
      throw new EngineError('INVALID_ATTEMPT', 'attempt debe ser un entero positivo.');
    }

    const initialSelection = await loadAndValidateSelection(root);
    if (initialSelection.classification) {
      return initialSelection;
    }

    lockDir = await acquireLock(root);

    const selectionResult = await loadAndValidateSelection(root);
    if (selectionResult.classification) {
      return selectionResult;
    }

    const { selection, selectionRaw, selectionDigest } = selectionResult;
    const taskId = selection.selectedTaskId;
    const expectedRevision = selection.sourceSnapshot.executionStateRevision;
    const { state, tasks } = await validateStateUnderLock(root);

    const recovery = await recoverFromJournal(root, {
      explicitAttempt,
      selection,
      selectionRaw,
      selectionDigest,
      state,
      tasks,
    });
    if (recovery) {
      return recovery.report;
    }

    const attempt = await resolveAttempt(root, taskId, explicitAttempt);
    const runContext = resolveCanonicalRunContext(root, taskId, attempt);
    const existingEvidence = await readFileSafe(runContext.selectionPath);
    const existingTask = findTaskById(tasks, taskId);

    if (existingEvidence !== null) {
      if (existingEvidence !== selectionRaw || computeDigest(existingEvidence) !== selectionDigest) {
        return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
          taskId,
          attempt,
          runPath: runContext.runPath,
          previousRevision: state.revision,
          newRevision: state.revision,
        });
      }

      if (exactPreparedState(existingTask, runContext.runPath, expectedRevision, expectedRevision + 1, state.revision)) {
        return result(ENGINE_CLASSIFICATIONS.IDEMPOTENT, {
          taskId,
          attempt,
          runPath: runContext.runPath,
          previousRevision: state.revision,
          newRevision: state.revision,
        });
      }

      return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
        taskId,
        attempt,
        runPath: runContext.runPath,
        previousRevision: state.revision,
        newRevision: state.revision,
      });
    }

    const runDirExists = await dirExists(runContext.runDirectory);
    if (runDirExists) {
      return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
        taskId,
        attempt,
        runPath: runContext.runPath,
        previousRevision: state.revision,
        newRevision: state.revision,
      });
    }

    if (state.revision !== expectedRevision) {
      return result(ENGINE_CLASSIFICATIONS.STALE_SELECTION, {
        taskId,
        previousRevision: state.revision,
        newRevision: state.revision,
      });
    }

    assertReservable(existingTask);

    const at = (typeof onTimestamp === 'function') ? onTimestamp() : nowIso();
    const newRevision = expectedRevision + 1;
    const reservation = {
      token: runContext.runPath,
      reservedAt: at,
      stateRevision: expectedRevision,
    };
    const updatedTask = buildReservedTask(existingTask, taskId, state.policy, reservation);
    const newState = produceNextState(state, updatedTask, taskId, newRevision, at);

    await writeJournal(root, {
      taskId,
      attempt,
      expectedRevision,
      targetRevision: newRevision,
      selectionDigest,
      officialTimestamp: at,
    });

    injectFault(FAULT_POINTS.AFTER_JOURNAL);

    await finalizeTransition(root, {
      runContext,
      selectionRaw,
      newState,
      writeEvidence: true,
      writeState: true,
    });

    return result(ENGINE_CLASSIFICATIONS.RUN_PREPARED, {
      taskId,
      attempt,
      runPath: runContext.runPath,
      previousRevision: state.revision,
      newRevision,
      recovered: false,
      idempotent: false,
    });
  } catch (error) {
    if (error instanceof EngineError && STABLE_RESULT_CODES.has(error.code)) {
      return result(error.code, error.fields);
    }
    throw error;
  } finally {
    if (lockDir) {
      await releaseLock(lockDir);
    }
  }
}

export { EngineError, CrashSimulationError, attemptDirectoryName, runPathFor };
