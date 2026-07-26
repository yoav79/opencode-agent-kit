import { createHash } from 'node:crypto';
import { mkdir, opendir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  isObject,
  isPositiveInteger,
  isNonNegativeInteger,
  loadJson,
  validateExecutionStateShape,
  validateTaskCollection,
  FILES,
  EXECUTION_ENGINE_FILES,
  READY_STATUSES,
  ATTEMPT_DIR_PATTERN,
  attemptDirectoryName,
  runPathFor,
} from './execution-contract-helpers.mjs';

const ENGINE_NAME = 'execution-transition-engine';
const TRANSITION_TYPE = 'prepare-task-run';
const ENGINE_CLASSIFICATIONS = {
  RUN_PREPARED: 'RUN_PREPARED',
  IDEMPOTENT: 'IDEMPOTENT',
  RECOVERED: 'RECOVERED',
  STALE_SELECTION: 'STALE_SELECTION',
  RUN_CONFLICT: 'RUN_CONFLICT',
  LOCK_FAILED: 'LOCK_FAILED',
};

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
    idempotent: fields.idempotent ?? false,
  };
}

class EngineError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
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

async function acquireLock(root) {
  const lockDir = path.join(root, EXECUTION_ENGINE_FILES.lock);
  const pid = process.pid;
  const host = os.hostname();
  const lockTimeoutMs = Number.parseInt(process.env.LOCK_TIMEOUT_MS, 10) || 30000;
  const lockRetryMs = Number.parseInt(process.env.LOCK_RETRY_MS, 10) || 200;
  const deadline = Date.now() + lockTimeoutMs;

  while (Date.now() < deadline) {
    try {
      await mkdir(lockDir);
      await writeFile(path.join(lockDir, 'pid'), String(pid), 'utf8');
      await writeFile(path.join(lockDir, 'host'), host, 'utf8');
      await writeFile(path.join(lockDir, 'ts'), String(Date.now()), 'utf8');
      return lockDir;
    } catch (err) {
      if (err.code !== 'EEXIST') throw new EngineError('LOCK_FAILED', `Error al adquirir lock: ${err.message}`);

      const stale = await isStaleLock(lockDir);
      if (stale) {
        await rm(lockDir, { recursive: true, force: true }).catch(() => {});
        continue;
      }

      await sleep(lockRetryMs);
    }
  }

  throw new EngineError('LOCK_TIMEOUT', `No se pudo adquirir el lock en ${lockTimeoutMs}ms.`);
}

async function isStaleLock(lockDir) {
  try {
    const pidRaw = await readFile(path.join(lockDir, 'pid'), 'utf8');
    const lockPid = Number.parseInt(pidRaw, 10);
    if (!Number.isInteger(lockPid) || lockPid <= 0) return true;

    try {
      process.kill(lockPid, 0);
    } catch {
      return true;
    }

    const tsRaw = await readFile(path.join(lockDir, 'ts'), 'utf8').catch(() => null);
    if (tsRaw !== null) {
      const ts = Number.parseInt(tsRaw, 10);
      if (Number.isInteger(ts) && Date.now() - ts > 60000) return true;
    }

    return false;
  } catch {
    return true;
  }
}

async function releaseLock(lockDir) {
  try {
    await rm(lockDir, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
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

async function directoryExists(dirPath) {
  try {
    await readFile(path.join(dirPath, '.check'), 'utf8');
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        await mkdir(dirPath, { recursive: true });
        await rm(dirPath, { recursive: true, force: true });
        return false;
      } catch {
        return true;
      }
    }
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

async function loadAndValidateSelection(root) {
  const issues = [];
  const loaded = await loadJson(root, FILES.selection, issues, { required: true });

  if (loaded.raw === null) {
    throw new EngineError('SELECTION_NOT_FOUND', `No existe ${FILES.selection}.`);
  }
  if (!loaded.value) {
    throw new EngineError('SELECTION_NOT_TASK_SELECTED', `${FILES.selection} no contiene un objeto JSON válido.`);
  }

  const selection = loaded.value;

  if (selection.classification !== 'TASK_SELECTED') {
    return result(ENGINE_CLASSIFICATIONS.STALE_SELECTION, {
      previousRevision: null,
      newRevision: null,
    });
  }

  if (typeof selection.selectedTaskId !== 'string' || selection.selectedTaskId.trim() === '') {
    throw new EngineError('SELECTION_INVALID', 'La selección no declara selectedTaskId.');
  }

  if (!isObject(selection.sourceSnapshot) || !isNonNegativeInteger(selection.sourceSnapshot.executionStateRevision)) {
    return result(ENGINE_CLASSIFICATIONS.STALE_SELECTION, {
      previousRevision: null,
      newRevision: null,
    });
  }

  return { selection, selectionRaw: loaded.raw };
}

async function validateStateUnderLock(root, expectedRevision) {
  const issues = [];
  const loaded = await loadJson(root, FILES.executionState, issues, { required: true });

  if (loaded.raw === null || !loaded.value) {
    throw new EngineError('EXECUTION_STATE_INVALID', `No se pudo leer ${FILES.executionState}.`);
  }

  const taskRecords = validateExecutionStateShape(loaded.value, issues);
  const validation = validateTaskCollection(taskRecords, FILES.executionState, 'tasks', issues);

  if (issues.length > 0) {
    throw new EngineError('EXECUTION_STATE_INVALID', issues.map((e) => e.code).join(', '));
  }

  const state = loaded.value;
  const tasks = validation.valid;

  if (expectedRevision !== null && state.revision !== expectedRevision) {
    return result(ENGINE_CLASSIFICATIONS.STALE_SELECTION, {
      previousRevision: state.revision,
      newRevision: state.revision,
    });
  }

  return { state, tasks, stateRaw: loaded.raw };
}

async function resolveAttempt(root, taskId, explicitAttempt) {
  if (explicitAttempt !== null) return explicitAttempt;

  const taskRunsDir = path.join(root, '.devflow', 'execution', 'runs', taskId);
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
    throw new EngineError('RUN_CONFLICT', 'La tarea ya no está en un estado reservable.');
  }

  if (existingTask.activeRunId !== null || existingTask.reservation !== null || existingTask.blocker !== null) {
    throw new EngineError('RUN_CONFLICT', 'La tarea ya tiene un run activo, una reserva o un blocker persistido.');
  }

  if (!isPositiveInteger(existingTask.maxAttempts) || !isNonNegativeInteger(existingTask.attemptCount)) {
    throw new EngineError('EXECUTION_STATE_INVALID', 'La tarea tiene un estado de intentos inválido.');
  }

  if (existingTask.attemptCount >= existingTask.maxAttempts) {
    throw new EngineError('RUN_CONFLICT', 'La tarea agotó sus intentos disponibles.');
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

function computeDigest(raw) {
  return `sha256:${createHash('sha256').update(raw, 'utf8').digest('hex')}`;
}

function journalPath(root) {
  return path.join(root, EXECUTION_ENGINE_FILES.journal);
}

async function writeJournal(root, fields) {
  const entry = {
    schemaVersion: 1,
    transitionType: TRANSITION_TYPE,
    taskId: fields.taskId,
    attempt: fields.attempt,
    runPath: fields.runPath,
    expectedRevision: fields.expectedRevision,
    targetRevision: fields.targetRevision,
    selectionDigest: fields.selectionDigest,
    phase: 'started',
    officialTimestamp: fields.officialTimestamp,
    expectedArtifacts: [
      runPathFor(fields.taskId, fields.attempt) + '/selection.json',
      FILES.executionState,
    ],
    createdAt: fields.officialTimestamp,
  };

  await writeFile(journalPath(root), `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
  return entry;
}

async function readJournal(root) {
  const jp = journalPath(root);
  try {
    const raw = await readFile(jp, 'utf8');
    const value = JSON.parse(raw);
    if (!isObject(value)) return null;
    return value;
  } catch {
    return null;
  }
}

async function removeJournal(root) {
  try {
    await rm(journalPath(root), { force: true });
  } catch {
  }
}

async function cleanTempFiles(root) {
  const stateTmp = path.join(root, FILES.executionState) + '.tmp';
  await rm(stateTmp, { force: true }).catch(() => {});
}

async function recoverFromJournal(root, selection, selectionRaw, state, tasks) {
  const journal = await readJournal(root);
  if (!journal) return null;

  if (journal.transitionType !== TRANSITION_TYPE || journal.schemaVersion !== 1) {
    await removeJournal(root);
    return null;
  }

  const taskRecord = findTaskById(tasks, journal.taskId);
  const evidencePath = path.join(root, journal.runPath, 'selection.json');
  const evidenceRaw = await readFileSafe(evidencePath);

  const stateReflectsTransition = taskRecord
    && taskRecord.status === 'reserved'
    && taskRecord.reservation !== null
    && taskRecord.reservation.stateRevision === journal.expectedRevision;

  if (stateReflectsTransition) {
    await removeJournal(root);
    await cleanTempFiles(root);

    if (journal.taskId === selection.selectedTaskId
      && journal.expectedRevision === selection.sourceSnapshot?.executionStateRevision) {
      const sameEvidence = evidenceRaw === selectionRaw;
      return result(ENGINE_CLASSIFICATIONS.IDEMPOTENT, {
        taskId: journal.taskId,
        attempt: journal.attempt,
        runPath: journal.runPath,
        previousRevision: state.revision,
        newRevision: state.revision,
        recovered: true,
        idempotent: sameEvidence,
      });
    }

    return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
      taskId: journal.taskId,
      previousRevision: state.revision,
      newRevision: state.revision,
    });
  }

  if (evidenceRaw !== null) {
    const at = journal.officialTimestamp || nowIso();
    const newRevision = state.revision + 1;
    const reservation = {
      token: journal.runPath,
      reservedAt: at,
      stateRevision: journal.expectedRevision,
    };
    const updatedTask = buildReservedTask(taskRecord, journal.taskId, state.policy, reservation);
    const newState = produceNextState(state, updatedTask, journal.taskId, newRevision, at);

    const stateTmp = path.join(root, FILES.executionState) + '.tmp';
    await writeFile(stateTmp, `${JSON.stringify(newState, null, 2)}\n`, 'utf8');
    await rename(stateTmp, path.join(root, FILES.executionState));

    await removeJournal(root);

    return result(ENGINE_CLASSIFICATIONS.RECOVERED, {
      taskId: journal.taskId,
      attempt: journal.attempt,
      runPath: journal.runPath,
      previousRevision: state.revision,
      newRevision,
      recovered: true,
      idempotent: false,
    });
  }

  if (journal.taskId === selection.selectedTaskId
    && journal.expectedRevision === state.revision
    && selection.sourceSnapshot?.executionStateRevision === state.revision) {
    await removeJournal(root);
    return null;
  }

  await removeJournal(root);
  return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
    taskId: journal.taskId,
    previousRevision: state.revision,
    newRevision: state.revision,
  });
}

export async function prepareTaskRun(options = {}) {
  const root = options.root || process.cwd();
  const explicitAttempt = options.attempt ?? null;
  const onTimestamp = options.onTimestamp || null;

  const selectionResult = await loadAndValidateSelection(root);
  if (selectionResult.classification) {
    return selectionResult;
  }

  const { selection, selectionRaw } = selectionResult;
  const taskId = selection.selectedTaskId;
  const expectedRevision = selection.sourceSnapshot.executionStateRevision;

  const lockDir = await acquireLock(root);

  try {
    const stateResult = await validateStateUnderLock(root, null);
    if (stateResult.classification) {
      return stateResult;
    }

    const { state, tasks } = stateResult;

    const recoveryResult = await recoverFromJournal(root, selection, selectionRaw, state, tasks);
    if (recoveryResult) {
      return recoveryResult;
    }

    const attempt = await resolveAttempt(root, taskId, explicitAttempt);
    const rp = runPathFor(taskId, attempt);
    const runDir = path.join(root, rp);
    const runSelectionPath = path.join(runDir, 'selection.json');

    const existingEvidence = await readFileSafe(runSelectionPath);
    if (existingEvidence !== null) {
      if (existingEvidence !== selectionRaw) {
        return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
          taskId,
          attempt,
          previousRevision: state.revision,
          newRevision: state.revision,
        });
      }

      const existingTask = findTaskById(tasks, taskId);
      if (existingTask && existingTask.status === 'reserved'
        && existingTask.reservation !== null
        && existingTask.reservation.token === rp) {
        return result(ENGINE_CLASSIFICATIONS.IDEMPOTENT, {
          taskId,
          attempt,
          runPath: rp,
          previousRevision: state.revision,
          newRevision: state.revision,
          idempotent: true,
        });
      }

      return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
        taskId,
        attempt,
        previousRevision: state.revision,
        newRevision: state.revision,
      });
    }

    const runDirExists = await dirExists(runDir);
    if (runDirExists) {
      return result(ENGINE_CLASSIFICATIONS.RUN_CONFLICT, {
        taskId,
        attempt,
        previousRevision: state.revision,
        newRevision: state.revision,
      });
    }

    if (state.revision !== expectedRevision) {
      return result(ENGINE_CLASSIFICATIONS.STALE_SELECTION, {
        previousRevision: state.revision,
        newRevision: state.revision,
      });
    }

    const existingTask = findTaskById(tasks, taskId);
    assertReservable(existingTask);

    const at = (typeof onTimestamp === 'function') ? onTimestamp() : nowIso();
    const newRevision = state.revision + 1;

    const reservation = {
      token: rp,
      reservedAt: at,
      stateRevision: expectedRevision,
    };

    const updatedTask = buildReservedTask(existingTask, taskId, state.policy, reservation);
    const newState = produceNextState(state, updatedTask, taskId, newRevision, at);
    const selectionDigest = computeDigest(selectionRaw);

    await writeJournal(root, {
      taskId,
      attempt,
      runPath: rp,
      expectedRevision,
      targetRevision: newRevision,
      selectionDigest,
      officialTimestamp: at,
    });

    injectFault(FAULT_POINTS.AFTER_JOURNAL);

    try {
      await mkdir(runDir, { recursive: true });

      const evidenceTmp = runSelectionPath + '.tmp';
      await writeFile(evidenceTmp, selectionRaw, 'utf8');
      await rename(evidenceTmp, runSelectionPath);

      injectFault(FAULT_POINTS.AFTER_EVIDENCE);

      const stateTmp = path.join(root, FILES.executionState) + '.tmp';
      await writeFile(stateTmp, `${JSON.stringify(newState, null, 2)}\n`, 'utf8');
      await rename(stateTmp, path.join(root, FILES.executionState));

      injectFault(FAULT_POINTS.AFTER_STATE);

      injectFault(FAULT_POINTS.BEFORE_CLEANUP);

      await removeJournal(root);
      await cleanTempFiles(root);
    } catch (writeError) {
      if (writeError instanceof CrashSimulationError) throw writeError;
      throw new EngineError('WRITE_FAILED', `Error durante escritura atómica: ${writeError.message}`);
    }

    return result(ENGINE_CLASSIFICATIONS.RUN_PREPARED, {
      taskId,
      attempt,
      runPath: rp,
      previousRevision: state.revision,
      newRevision,
      recovered: false,
      idempotent: false,
    });
  } finally {
    await releaseLock(lockDir);
  }
}
