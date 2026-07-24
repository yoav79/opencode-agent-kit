#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { access, lstat, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TOOL_VERSION = '1.0';
const ROOT = process.cwd();
const TP = path.join(ROOT, '.devflow', 'task-planner');
const STATE = path.join(TP, 'project-state.json');

const MANAGED = new Set([
  '.devflow/task-planner/project-state.json',
  '.devflow/task-planner/decisions.json',
  '.devflow/task-planner/semantic-contract.json',
  '.devflow/task-planner/requirements.json',
  '.devflow/task-planner/capability-map.json',
  '.devflow/task-planner/epic-plan.json',
  '.devflow/task-planner/task-plan.json',
]);

function usage() {
  console.error(`Uso:
  node .devflow/task-planner/tools/update-timestamps.mjs bootstrap
  node .devflow/task-planner/tools/update-timestamps.mjs touch <archivo.json> [archivo.json...]
  node .devflow/task-planner/tools/update-timestamps.mjs approval-requested <resolvedBlueprint|finalPlan>
  node .devflow/task-planner/tools/update-timestamps.mjs approval-resolved <resolvedBlueprint|finalPlan> <approved|rejected> <user>
  node .devflow/task-planner/tools/update-timestamps.mjs complete`);
}

function nowIso() {
  const override = process.env.NODE_ENV === 'test'
    ? process.env.TASK_PLANNER_TEST_NOW
    : null;
  const value = override || new Date().toISOString();
  if (Number.isNaN(Date.parse(value))) {
    throw new Error('El reloj devolvió una fecha inválida.');
  }
  return new Date(value).toISOString();
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function digest(document) {
  const clone = structuredClone(document);
  if (clone.timestamps && typeof clone.timestamps === 'object') {
    delete clone.timestamps.contentHash;
  }
  const body = JSON.stringify(canonical(clone));
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function isIso(value) {
  return typeof value === 'string' && value !== '' && !Number.isNaN(Date.parse(value));
}

function normalizeManaged(input) {
  const normalized = path.normalize(input).split(path.sep).join('/').replace(/^\.\//, '');
  if (!MANAGED.has(normalized)) {
    throw new Error(`Archivo no administrado: ${input}`);
  }
  return path.join(ROOT, normalized);
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function readJson(file) {
  const stat = await lstat(file);
  if (stat.isSymbolicLink()) throw new Error(`Se rechaza symlink: ${file}`);
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`La raíz JSON debe ser objeto: ${file}`);
  }
  return parsed;
}

async function writeAtomic(file, document) {
  document.timestamps ??= {};
  document.timestamps.contentHash = digest(document);
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(temp, file);
}

function applyTouch(document, at, { projectState = false } = {}) {
  document.timestamps ??= {};
  if (!isIso(document.timestamps.createdAt)) document.timestamps.createdAt = at;
  document.timestamps.updatedAt = at;
  if (projectState && typeof document.timestamps.completedAt === 'undefined') {
    document.timestamps.completedAt = null;
  }
}

async function saveState(state, at) {
  applyTouch(state, at, { projectState: true });
  await writeAtomic(STATE, state);
}

async function bootstrap(at) {
  if (!(await exists(STATE))) throw new Error('Falta .devflow/task-planner/project-state.json.');
  const state = await readJson(STATE);
  for (const relative of MANAGED) {
    const file = path.join(ROOT, relative);
    if (!(await exists(file))) continue;
    const document = relative.endsWith('project-state.json') ? state : await readJson(file);
    applyTouch(document, at, { projectState: relative.endsWith('project-state.json') });
    if (!relative.endsWith('project-state.json')) await writeAtomic(file, document);
  }
  await saveState(state, at);
  return [...MANAGED].filter((relative) => path.join(ROOT, relative));
}

async function touch(files, at) {
  if (files.length === 0) throw new Error('touch requiere al menos un archivo JSON.');
  const state = await readJson(STATE);
  const touched = [];
  for (const input of files) {
    const file = normalizeManaged(input);
    const relative = path.relative(ROOT, file).split(path.sep).join('/');
    if (!(await exists(file))) throw new Error(`No existe ${relative}.`);
    if (file === STATE) {
      applyTouch(state, at, { projectState: true });
    } else {
      const document = await readJson(file);
      applyTouch(document, at);
      await writeAtomic(file, document);
    }
    touched.push(relative);
  }
  await saveState(state, at);
  return touched;
}

async function approvalRequested(key, at) {
  const state = await readJson(STATE);
  if (!['resolvedBlueprint', 'finalPlan'].includes(key)) throw new Error(`Aprobación desconocida: ${key}`);
  const record = state.approvals?.[key];
  if (!record || typeof record !== 'object') throw new Error(`Falta approvals.${key}.`);
  record.status = 'requested';
  record.requestedAt = at;
  record.resolvedAt = null;
  record.resolvedBy = null;
  await saveState(state, at);
  return [`approvals.${key}.requestedAt`];
}

async function approvalResolved(key, status, resolvedBy, at) {
  const state = await readJson(STATE);
  if (!['resolvedBlueprint', 'finalPlan'].includes(key)) throw new Error(`Aprobación desconocida: ${key}`);
  if (!['approved', 'rejected'].includes(status)) throw new Error(`Estado de aprobación inválido: ${status}`);
  if (resolvedBy !== 'user') throw new Error('resolvedBy debe ser user.');
  const record = state.approvals?.[key];
  if (!record || typeof record !== 'object') throw new Error(`Falta approvals.${key}.`);
  if (!isIso(record.requestedAt)) throw new Error(`approvals.${key}.requestedAt debe existir antes de resolver.`);
  record.status = status;
  record.resolvedAt = at;
  record.resolvedBy = resolvedBy;
  await saveState(state, at);
  return [`approvals.${key}.resolvedAt`];
}

async function complete(at) {
  const state = await readJson(STATE);
  if (state.workflow?.status !== 'completed') {
    throw new Error('complete exige workflow.status=completed antes de registrar la fecha.');
  }
  state.timestamps ??= {};
  state.timestamps.completedAt = at;
  await saveState(state, at);
  return ['timestamps.completedAt'];
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command) { usage(); process.exit(2); }
  const at = nowIso();
  let changed;
  if (command === 'bootstrap') changed = await bootstrap(at);
  else if (command === 'touch') changed = await touch(args, at);
  else if (command === 'approval-requested') changed = await approvalRequested(args[0], at);
  else if (command === 'approval-resolved') changed = await approvalResolved(args[0], args[1], args[2], at);
  else if (command === 'complete') changed = await complete(at);
  else { usage(); throw new Error(`Comando desconocido: ${command}`); }
  console.log(JSON.stringify({ tool: 'update-timestamps.mjs', version: TOOL_VERSION, at, changed }, null, 2));
}

main().catch((error) => {
  console.error(`Timestamp update failed: ${error.message}`);
  process.exit(1);
});
