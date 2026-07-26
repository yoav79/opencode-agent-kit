#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  FILES,
  isNonNegativeInteger,
  isObject,
  isPositiveInteger,
  loadJson,
  validateExecutionStateShape,
  validateTaskCollection,
} from './select-next-task.mjs';

const TOOL_NAME = 'prepare-task-run.mjs';
const READY_STATUSES = new Set(['pending', 'interrupted', 'failed_retryable']);
const ATTEMPT_DIR_PATTERN = /^attempt-(\d+)$/;

class CommandFailure extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function usage() {
  console.error(`Uso: node ${TOOL_NAME} [--root RUTA] [--attempt N]`);
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    attempt: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('Falta el valor de --root.');
      options.root = path.resolve(value);
      index += 1;
      continue;
    }

    if (arg === '--attempt') {
      const value = argv[index + 1];
      if (!value) throw new CommandFailure('INVALID_ATTEMPT', 'Falta el valor de --attempt.');
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 1 || `${parsed}` !== value.trim()) {
        throw new CommandFailure('INVALID_ATTEMPT', 'attempt debe ser un entero mayor o igual a 1.');
      }
      options.attempt = parsed;
      index += 1;
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    }

    throw new Error(`Argumento desconocido: ${arg}`);
  }

  return options;
}

function attemptDirectoryName(attempt) {
  return `attempt-${String(attempt).padStart(2, '0')}`;
}

function runPathFor(taskId, attempt) {
  return path.posix.join('.devflow', 'execution', 'runs', taskId, attemptDirectoryName(attempt));
}

function resolveTimestampTool() {
  const configHome = process.env.XDG_CONFIG_HOME
    ? path.resolve(process.env.XDG_CONFIG_HOME)
    : path.join(os.homedir(), '.config');
  return path.join(configHome, 'opencode', 'templates', 'shared', 'tools', 'timestamp.mjs');
}

function runNode(commandArgs, message) {
  const result = spawnSync('node', commandArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || message);
  }

  return result.stdout.trim();
}

function nowIso() {
  return runNode([resolveTimestampTool(), 'now'], 'No se pudo obtener un timestamp oficial.');
}

function touchExecutionState(toolPath, filePath, at) {
  runNode([toolPath, filePath, at], 'No se pudo actualizar execution-state.json.');
}

async function loadSelection(root) {
  const loaded = await loadJson(root, FILES.selection, [], { required: true });
  if (loaded.raw === null) {
    throw new CommandFailure('SELECTION_NOT_FOUND', `No existe ${FILES.selection}.`);
  }
  if (!loaded.value) {
    throw new CommandFailure('SELECTION_NOT_TASK_SELECTED', `${FILES.selection} no contiene un objeto JSON válido.`);
  }

  const selection = loaded.value;
  if (selection.classification !== 'TASK_SELECTED') {
    throw new CommandFailure('SELECTION_NOT_TASK_SELECTED', 'La selección actual no está en TASK_SELECTED.');
  }
  if (typeof selection.selectedTaskId !== 'string' || selection.selectedTaskId.trim() === '') {
    throw new CommandFailure('SELECTION_NOT_TASK_SELECTED', 'La selección actual no declara selectedTaskId.');
  }
  if (!isObject(selection.sourceSnapshot) || !isNonNegativeInteger(selection.sourceSnapshot.executionStateRevision)) {
    throw new CommandFailure('STALE_SELECTION', 'La selección no conserva un sourceSnapshot utilizable.');
  }

  return {
    raw: loaded.raw,
    selection,
  };
}

async function loadExecutionState(root) {
  const issues = [];
  const loaded = await loadJson(root, FILES.executionState, issues, { required: true });
  if (loaded.raw === null || !loaded.value) {
    throw new CommandFailure('EXECUTION_STATE_INVALID', `No se pudo leer ${FILES.executionState}.`);
  }

  const taskRecords = validateExecutionStateShape(loaded.value, issues);
  const validation = validateTaskCollection(taskRecords, FILES.executionState, 'tasks', issues);
  if (issues.length > 0) {
    throw new CommandFailure('EXECUTION_STATE_INVALID', issues.map((entry) => entry.code).join(', '));
  }

  return {
    raw: loaded.raw,
    executionState: loaded.value,
    tasks: validation.valid,
  };
}

async function readAttemptEvidence(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

async function directoryExists(dirPath) {
  try {
    await readdir(dirPath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function resolveAttempt(root, taskId, explicitAttempt) {
  if (explicitAttempt !== null) return explicitAttempt;

  const taskRunsDir = path.join(root, '.devflow', 'execution', 'runs', taskId);
  let entries = [];
  try {
    entries = await readdir(taskRunsDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') return 1;
    throw error;
  }

  let maxAttempt = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const match = ATTEMPT_DIR_PATTERN.exec(entry.name);
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    if (Number.isInteger(value) && value > maxAttempt) maxAttempt = value;
  }

  return maxAttempt === 0 ? 1 : maxAttempt + 1;
}

function buildTaskState(existing, taskId, policy, reservation) {
  return {
    taskId,
    status: 'reserved',
    attemptCount: existing?.attemptCount ?? 0,
    maxAttempts: existing?.maxAttempts ?? policy.defaultMaxAttempts,
    activeRunId: null,
    reservation,
    blocker: null,
    lastResult: existing?.lastResult ?? null,
    updatedAt: null,
  };
}

function assertReservable(existing) {
  if (!existing) return;
  if (!READY_STATUSES.has(existing.status)) {
    throw new CommandFailure('RUN_CONFLICT', 'La tarea ya no está en un estado reservable.');
  }
  if (existing.activeRunId !== null || existing.reservation !== null || existing.blocker !== null) {
    throw new CommandFailure('RUN_CONFLICT', 'La tarea ya tiene un run activo, una reserva o un blocker persistido.');
  }
  if (!isPositiveInteger(existing.maxAttempts) || !isNonNegativeInteger(existing.attemptCount)) {
    throw new CommandFailure('EXECUTION_STATE_INVALID', 'La tarea tiene un estado de intentos inválido.');
  }
  if (existing.attemptCount >= existing.maxAttempts) {
    throw new CommandFailure('RUN_CONFLICT', 'La tarea agotó sus intentos disponibles.');
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof CommandFailure) throw error;
    console.error(error.message);
    usage();
    process.exit(2);
  }

  const { root, attempt: explicitAttempt } = options;
  const { raw: selectionRaw, selection } = await loadSelection(root);
  const taskId = selection.selectedTaskId;

  if (explicitAttempt !== null) {
    const existingRunPath = runPathFor(taskId, explicitAttempt);
    const existingRunDir = path.join(root, existingRunPath);
    const existingSelectionPath = path.join(root, existingRunPath, 'selection.json');
    const existingSelectionRaw = await readAttemptEvidence(existingSelectionPath);
    if (existingSelectionRaw !== null) {
      if (existingSelectionRaw !== selectionRaw) {
        throw new CommandFailure('RUN_CONFLICT', 'La evidencia existente del run no coincide con la selección actual.');
      }
      const { executionState } = await loadExecutionState(root);
      console.log(JSON.stringify({
        taskId,
        attempt: explicitAttempt,
        runPath: existingRunPath,
        newRevision: executionState.revision,
        status: 'prepared',
      }, null, 2));
      return;
    }
    if (await directoryExists(existingRunDir)) {
      throw new CommandFailure('RUN_CONFLICT', 'El directorio del intento ya existe sin evidencia utilizable.');
    }
  }

  const { executionState, tasks } = await loadExecutionState(root);
  if (selection.sourceSnapshot.executionStateRevision !== executionState.revision) {
    throw new CommandFailure('STALE_SELECTION', 'La selección ya no corresponde con la revisión actual del estado.');
  }

  const attempt = await resolveAttempt(root, taskId, explicitAttempt);
  const runPath = runPathFor(taskId, attempt);
  const runDir = path.join(root, runPath);
  const runSelectionPath = path.join(runDir, 'selection.json');
  const existingSelectionRaw = await readAttemptEvidence(runSelectionPath);
  if (existingSelectionRaw !== null) {
    if (existingSelectionRaw !== selectionRaw) {
      throw new CommandFailure('RUN_CONFLICT', 'La evidencia existente del run no coincide con la selección actual.');
    }
    console.log(JSON.stringify({
      taskId,
      attempt,
      runPath,
      newRevision: executionState.revision,
      status: 'prepared',
    }, null, 2));
    return;
  }
  if (await directoryExists(runDir)) {
    throw new CommandFailure('RUN_CONFLICT', 'El directorio del intento ya existe sin evidencia utilizable.');
  }

  const existingTask = tasks.find((entry) => entry.taskId === taskId) ?? null;
  assertReservable(existingTask);

  const at = nowIso();
  const reservation = {
    token: runPath,
    reservedAt: at,
    stateRevision: selection.sourceSnapshot.executionStateRevision,
  };

  const updatedTask = buildTaskState(existingTask, taskId, executionState.policy, reservation);
  if (existingTask) {
    const index = executionState.tasks.findIndex((entry) => entry.taskId === taskId);
    executionState.tasks.splice(index, 1, updatedTask);
  } else {
    executionState.tasks.push(updatedTask);
  }

  executionState.revision += 1;

  await mkdir(runDir, { recursive: true });
  await writeFile(runSelectionPath, selectionRaw, 'utf8');
  await writeFile(
    path.join(root, FILES.executionState),
    `${JSON.stringify(executionState, null, 2)}\n`,
    'utf8',
  );

  touchExecutionState(path.join(root, '.devflow', 'execution', 'tools', 'touch-execution-state.mjs'), path.join(root, FILES.executionState), at);

  console.log(JSON.stringify({
    taskId,
    attempt,
    runPath,
    newRevision: executionState.revision,
    status: 'prepared',
  }, null, 2));
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsMain = process.argv[1] && path.resolve(process.argv[1]) === thisFile;
if (invokedAsMain) {
  main().catch((error) => {
    if (error instanceof CommandFailure) {
      console.error(error.code);
      process.exit(1);
    }
    console.error(`Error interno de ${TOOL_NAME}: ${error.stack ?? error.message}`);
    process.exit(2);
  });
}
