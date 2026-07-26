import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export * from '../../shared/tools/devflow-runtime-helpers.mjs';

import {
  ACTIVE_RUN_STATUSES,
  FILES,
  issue,
  loadJson,
  resolveCanonicalRunContext,
  taskIdentityKey,
  TASK_SELECTED_CLASSIFICATION,
  validateExecutionStateShape,
  validateSelectionForPreparation,
  validateTaskCollection,
} from '../../shared/tools/devflow-runtime-helpers.mjs';

class ExecutionContractError extends Error {
  constructor(code, message, fields = {}) {
    super(message);
    this.code = code;
    this.fields = fields;
    this.name = 'ExecutionContractError';
  }
}

function persistedRunTokenFor(taskRecord) {
  if (taskRecord.status === 'reserved') {
    return taskRecord.reservation?.token ?? null;
  }
  if (ACTIVE_RUN_STATUSES.has(taskRecord.status)) {
    return taskRecord.activeRunId ?? null;
  }
  return null;
}

function parsePersistedRunToken(root, token) {
  const match = /^\.devflow\/execution\/runs\/([^/]+)\/attempt-(\d+)$/.exec(token ?? '');
  if (!match) {
    throw new ExecutionContractError('RUN_TOKEN_INVALID', 'El token persistido no sigue el formato canónico del runtime.');
  }

  const taskId = match[1];
  const attempt = Number.parseInt(match[2], 10);
  const runContext = resolveCanonicalRunContext(root, taskId, attempt);
  if (runContext.runPath !== token) {
    throw new ExecutionContractError('RUN_TOKEN_INVALID', 'El token persistido no coincide con el runPath canónico.');
  }

  return { taskId, attempt, runContext };
}

async function readRunEvidence(selectionPath) {
  try {
    return await readFile(selectionPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new ExecutionContractError('RUN_NOT_PREPARED', 'Falta la evidencia selection.json del run preparado.');
    }
    throw error;
  }
}

export async function resolvePreparedContextRequest(root, options = {}) {
  const selectionLocation = options.selectionPath ?? FILES.selection;
  const stateLocation = options.statePath ?? FILES.executionState;
  const selectionIssues = [];
  const selectionLoaded = await loadJson(root, selectionLocation, selectionIssues, { required: true });

  if (selectionLoaded.raw === null) {
    throw new ExecutionContractError('SELECTION_NOT_FOUND', `No existe ${selectionLocation}.`);
  }
  if (!selectionLoaded.value) {
    throw new ExecutionContractError('SELECTION_NOT_TASK_SELECTED', `${selectionLocation} no contiene una selección usable.`);
  }

  validateSelectionForPreparation(selectionLoaded.value, selectionLocation, selectionIssues);
  if (selectionIssues.length > 0 || selectionLoaded.value.classification !== TASK_SELECTED_CLASSIFICATION) {
    throw new ExecutionContractError('SELECTION_NOT_TASK_SELECTED', 'La selección global no está en estado TASK_SELECTED.', {
      issues: selectionIssues,
    });
  }

  const taskId = selectionLoaded.value.selectedTaskId;
  const stateIssues = [];
  const stateLoaded = await loadJson(root, stateLocation, stateIssues, { required: true });
  if (stateLoaded.raw === null || !stateLoaded.value) {
    throw new ExecutionContractError('EXECUTION_STATE_INVALID', `No se pudo leer ${stateLocation}.`);
  }

  const taskRecords = validateExecutionStateShape(stateLoaded.value, stateIssues);
  const taskValidation = validateTaskCollection(taskRecords, stateLocation, 'tasks', stateIssues);
  if (stateIssues.length > 0) {
    throw new ExecutionContractError('EXECUTION_STATE_INVALID', 'execution-state.json no cumple el contrato vigente.', {
      issues: stateIssues,
    });
  }

  const identity = taskIdentityKey(taskId);
  const matches = taskValidation.valid.filter((entry) => taskIdentityKey(entry.taskId) === identity);
  if (matches.length === 0) {
    throw new ExecutionContractError('RUN_NOT_PREPARED', 'La tarea seleccionada no tiene una entrada reservada o activa en execution-state.json.');
  }
  if (matches.length !== 1) {
    throw new ExecutionContractError('EXECUTION_STATE_INVALID', 'La tarea seleccionada no resuelve exactamente una entrada canónica de estado.');
  }

  const taskRecord = matches[0];
  const token = persistedRunTokenFor(taskRecord);
  if (!token) {
    throw new ExecutionContractError('RUN_NOT_PREPARED', 'La tarea seleccionada no tiene reserva ni run activo persistidos.');
  }

  const { taskId: tokenTaskId, attempt, runContext } = parsePersistedRunToken(root, token);
  if (taskIdentityKey(tokenTaskId) !== identity || tokenTaskId !== taskRecord.taskId) {
    throw new ExecutionContractError('RUN_CONFLICT', 'El token persistido apunta a otra tarea.');
  }

  try {
    await access(runContext.runDirectory);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new ExecutionContractError('RUN_NOT_PREPARED', 'El directorio del run preparado no existe.');
    }
    throw error;
  }
  const evidenceRaw = await readRunEvidence(runContext.selectionPath);
  if (evidenceRaw !== selectionLoaded.raw) {
    throw new ExecutionContractError('RUN_CONFLICT', 'La evidencia del run no coincide con la selección global actual.');
  }

  return {
    taskId: taskRecord.taskId,
    attempt,
    runPath: runContext.runPath,
  };
}

export { ExecutionContractError };
