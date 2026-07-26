#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export * from './execution-contract-helpers.mjs';

import {
  isObject,
  isPositiveInteger,
  isNonNegativeInteger,
  sameKeys,
  loadJson,
  issue,
  pushUniqueIssue,
  validateTaskCollection,
  validateExecutionStateShape,
  validateEpicCollection,
  validateContentHash,
  findTaskCycle,
  compareTaskIds,
  requireObject,
  requireArray,
  taskIdentityKey,
  TASK_ID_PATTERN,
  HASH_PATTERN,
  FILES,
  READY_STATUSES,
  ACTIVE_STATUSES,
} from './execution-contract-helpers.mjs';

export const SELECTOR_NAME = 'select-next-task.mjs';
export const SELECTOR_VERSION = '1.0';

export function snapshotFrom(documents) {
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

export function errorSelection(classification, sourceSnapshot, issues) {
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

export function noReadySelection(sourceSnapshot) {
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

export async function computeExpected(root) {
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
  const planTaskByIdentity = taskValidation.identityOwners;
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
      if (!TASK_ID_PATTERN.test(dependencyId)) {
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
    const identityKey = taskIdentityKey(entry.taskId);
    const planId = identityKey === null ? null : planTaskByIdentity.get(identityKey);
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

function usage() {
  console.error(`Uso: node ${SELECTOR_NAME} [--root RUTA]`);
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('Falta el valor de --root.');
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Argumento desconocido: ${arg}`);
    }
  }

  return options;
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

  const { expected } = await computeExpected(options.root);
  const selectionPath = path.join(options.root, FILES.selection);
  const serialized = `${JSON.stringify(expected, null, 2)}\n`;

  await writeFile(selectionPath, serialized, 'utf8');
  process.stdout.write(`${expected.classification}\n`);
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsMain = process.argv[1] && path.resolve(process.argv[1]) === thisFile;
if (invokedAsMain) {
  main().catch((error) => {
    console.error(`Error interno de ${SELECTOR_NAME}: ${error.stack ?? error.message}`);
    process.exit(2);
  });
}
