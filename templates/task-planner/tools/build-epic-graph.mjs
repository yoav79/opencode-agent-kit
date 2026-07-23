#!/usr/bin/env node

import { access, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const GRAPH_BUILDER_VERSION = '1.0';
const ROOT = process.cwd();
const TP = path.join(ROOT, 'task-planning');
const EPIC_FILE = path.join(TP, 'epic-plan.json');
const CAPABILITY_FILE = path.join(TP, 'capability-map.json');
const TASK_FILE = path.join(TP, 'task-plan.json');
const STATE_FILE = path.join(TP, 'project-state.json');
const TIMESTAMP_TOOL = path.join(TP, 'tools', 'update-timestamps.mjs');

const arr = (value) => (Array.isArray(value) ? value : []);
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

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

function addRelation(relations, consumerEpicId, providerEpicId, type, capabilityId = null, taskId = null) {
  if (!consumerEpicId || !providerEpicId || consumerEpicId === providerEpicId) return;

  const key = `${consumerEpicId}::${providerEpicId}`;
  let relation = relations.get(key);
  if (!relation) {
    relation = {
      fromEpicId: consumerEpicId,
      epicId: providerEpicId,
      types: new Set(),
      capabilityIds: new Set(),
      taskIds: new Set(),
    };
    relations.set(key, relation);
  }

  relation.types.add(type);
  if (capabilityId) relation.capabilityIds.add(capabilityId);
  if (taskId) relation.taskIds.add(taskId);
}

function detectCycle(epicIds, dependenciesByEpic) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(epicId) {
    if (visited.has(epicId)) return null;
    if (visiting.has(epicId)) {
      const start = stack.indexOf(epicId);
      return [...stack.slice(start), epicId];
    }

    visiting.add(epicId);
    stack.push(epicId);

    for (const dependencyId of dependenciesByEpic.get(epicId) ?? []) {
      const cycle = visit(dependencyId);
      if (cycle) return cycle;
    }

    stack.pop();
    visiting.delete(epicId);
    visited.add(epicId);
    return null;
  }

  for (const epicId of epicIds) {
    const cycle = visit(epicId);
    if (cycle) return cycle;
  }
  return null;
}

function computeWaves(epicIds, dependenciesByEpic) {
  const memo = new Map();

  function waveOf(epicId) {
    if (memo.has(epicId)) return memo.get(epicId);
    const dependencies = dependenciesByEpic.get(epicId) ?? [];
    const wave = dependencies.length === 0
      ? 1
      : 1 + Math.max(...dependencies.map(waveOf));
    memo.set(epicId, wave);
    return wave;
  }

  const waves = new Map();
  for (const epicId of epicIds) {
    const wave = waveOf(epicId);
    const members = waves.get(wave) ?? [];
    members.push(epicId);
    waves.set(wave, members);
  }

  return {
    waveByEpic: memo,
    executionWaves: [...waves.entries()]
      .sort(([a], [b]) => a - b)
      .map(([wave, ids]) => ({ wave, epicIds: ids.sort(compareIds) })),
  };
}

function relationReason(relation) {
  const parts = [];
  if (relation.capabilityIds.size > 0) {
    parts.push(`consume capacidades ${[...relation.capabilityIds].sort(compareIds).join(', ')}`);
  }
  if (relation.taskIds.size > 0) {
    parts.push(`depende de tareas ${[...relation.taskIds].sort(compareIds).join(', ')}`);
  }
  return parts.length > 0
    ? `La épica ${relation.fromEpicId} ${parts.join(' y ')} de ${relation.epicId}.`
    : `La épica ${relation.fromEpicId} depende de ${relation.epicId}.`;
}

async function main() {
  const epicPlan = await readJson(EPIC_FILE, 'epic-plan.json');
  const capabilityPlan = await readJson(CAPABILITY_FILE, 'capability-map.json');
  const taskPlan = (await exists(TASK_FILE))
    ? await readJson(TASK_FILE, 'task-plan.json')
    : { tasks: [] };
  const state = (await exists(STATE_FILE))
    ? await readJson(STATE_FILE, 'project-state.json')
    : null;

  if (![3, 4].includes(epicPlan.schemaVersion)) {
    throw new Error(`epic-plan.json schemaVersion debe ser 3 o 4, recibió ${JSON.stringify(epicPlan.schemaVersion)}`);
  }

  const epics = arr(epicPlan.epics);
  const capabilities = arr(capabilityPlan.capabilities);
  const tasks = arr(taskPlan.tasks);
  const epicMap = indexById(epics, 'epic-plan.epics');
  const capabilityMap = indexById(capabilities, 'capability-map.capabilities');
  const taskMap = indexById(tasks, 'task-plan.tasks');

  const relations = new Map();

  for (const capability of capabilities) {
    if (!obj(capability) || capability.implementationKind !== 'planned') continue;
    const consumerEpicId = capability.ownerEpicId;
    if (!epicMap.has(consumerEpicId)) continue;

    for (const requiredCapabilityId of arr(capability.requiredCapabilityIds)) {
      const requiredCapability = capabilityMap.get(requiredCapabilityId);
      if (!requiredCapability || requiredCapability.implementationKind !== 'planned') continue;
      const providerEpicId = requiredCapability.ownerEpicId;
      if (!epicMap.has(providerEpicId)) continue;
      addRelation(relations, consumerEpicId, providerEpicId, 'capability', requiredCapabilityId, null);
    }
  }

  for (const task of tasks) {
    if (!obj(task) || !epicMap.has(task.epicId)) continue;
    for (const dependencyTaskId of arr(task.dependencyIds)) {
      const dependencyTask = taskMap.get(dependencyTaskId);
      if (!dependencyTask || !epicMap.has(dependencyTask.epicId)) continue;
      addRelation(relations, task.epicId, dependencyTask.epicId, 'task_dependency', null, dependencyTaskId);
    }
  }

  const relationsByEpic = new Map();
  for (const relation of relations.values()) {
    const list = relationsByEpic.get(relation.fromEpicId) ?? [];
    list.push(relation);
    relationsByEpic.set(relation.fromEpicId, list);
  }

  const dependenciesByEpic = new Map();
  for (const epic of epics) {
    const epicRelations = (relationsByEpic.get(epic.id) ?? [])
      .sort((a, b) => compareIds(a.epicId, b.epicId));
    dependenciesByEpic.set(epic.id, epicRelations.map((relation) => relation.epicId));
  }

  const epicIds = [...epicMap.keys()].sort(compareIds);
  const cycle = detectCycle(epicIds, dependenciesByEpic);
  if (cycle) {
    throw new Error(`EPIC_DEPENDENCY_CYCLE: ${cycle.join(' -> ')}`);
  }

  const { waveByEpic, executionWaves } = computeWaves(epicIds, dependenciesByEpic);

  for (const epic of epics) {
    const epicRelations = (relationsByEpic.get(epic.id) ?? [])
      .sort((a, b) => compareIds(a.epicId, b.epicId));

    epic.dependencyIds = epicRelations.map((relation) => relation.epicId);
    epic.dependencyDetails = epicRelations.map((relation) => ({
      epicId: relation.epicId,
      types: [...relation.types].sort(compareIds),
      capabilityIds: [...relation.capabilityIds].sort(compareIds),
      taskIds: [...relation.taskIds].sort(compareIds),
      reason: relationReason(relation),
    }));
    epic.executionWave = waveByEpic.get(epic.id) ?? 1;
  }

  epicPlan.schemaVersion = 4;
  epicPlan.graph = {
    version: GRAPH_BUILDER_VERSION,
    status: 'generated',
    dependencyCount: relations.size,
    waveCount: executionWaves.length,
    parallelCandidateCount: executionWaves
      .filter((wave) => wave.epicIds.length > 1)
      .reduce((total, wave) => total + wave.epicIds.length, 0),
  };
  epicPlan.executionWaves = executionWaves;

  await writeJson(EPIC_FILE, epicPlan);

  if (state) {
    state.planner.workflowVersion = 7;
    state.planner.validatorVersion = '3.5';
    state.planner.epicGraphVersion = GRAPH_BUILDER_VERSION;
    state.progress.epicDependenciesDetected = relations.size;
    state.progress.executionWavesGenerated = executionWaves.length;
    state.progress.parallelEpicCandidates = epicPlan.graph.parallelCandidateCount;
    state.progress.epicGraphValidated = true;
    state.artifacts.epicGraphBuilder = {
      path: 'task-planning/tools/build-epic-graph.mjs',
      status: 'available',
    };
    await writeJson(STATE_FILE, state);
  }

  if (await exists(TIMESTAMP_TOOL)) {
    const files = ['task-planning/epic-plan.json'];
    if (state) files.push('task-planning/project-state.json');
    const result = spawnSync('node', [
      'task-planning/tools/update-timestamps.mjs',
      'touch',
      ...files,
    ], {
      cwd: ROOT,
      encoding: 'utf8',
      env: process.env,
    });
    if (result.status !== 0) {
      throw new Error(`update-timestamps.mjs falló: ${result.stderr || result.stdout}`);
    }
  }

  process.stdout.write(`${JSON.stringify({
    version: GRAPH_BUILDER_VERSION,
    epics: epics.length,
    dependencies: relations.size,
    executionWaves,
    parallelCandidateCount: epicPlan.graph.parallelCandidateCount,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Epic graph build failed: ${error.message}\n`);
  process.exitCode = 1;
});
