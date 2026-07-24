#!/usr/bin/env node

import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

const VALIDATOR_VERSION = '3.5';

const ROOT = process.cwd();
const TP = path.join(ROOT, '.devflow', 'task-planner');

const P = {
  state: path.join(TP, 'project-state.json'),
  decisions: path.join(TP, 'decisions.json'),
  requirements: path.join(TP, 'requirements.json'),
  semantic: path.join(TP, 'semantic-contract.json'),
  blueprint: path.join(TP, 'SOFTWARE-BLUEPRINT-RESOLVED.md'),
  capabilities: path.join(TP, 'capability-map.json'),
  epics: path.join(TP, 'epic-plan.json'),
  epicDir: path.join(TP, 'epics'),
  tasks: path.join(TP, 'task-plan.json'),
  taskDir: path.join(TP, 'tasks'),
  readiness: path.join(TP, 'readiness.json'),
  report: path.join(TP, 'validation-report.md'),
  timestampUpdater: path.join(TP, 'tools', 'update-timestamps.mjs'),
  epicGraphBuilder: path.join(TP, 'tools', 'build-epic-graph.mjs'),
};

const errors = [];
const warnings = [];

const rel = (filePath) =>
  path.relative(ROOT, filePath).split(path.sep).join('/');

const arr = (value) => (Array.isArray(value) ? value : []);

const obj = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

function addError(code, message, file = null, reference = null) {
  errors.push({
    code,
    message,
    file,
    reference,
  });
}

function addWarning(code, message, file = null, reference = null) {
  warnings.push({
    code,
    message,
    file,
    reference,
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, label) {
  if (!(await exists(filePath))) {
    addError(
      'FILE_MISSING',
      `Falta ${rel(filePath)}.`,
      rel(filePath),
    );

    return null;
  }

  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));

    if (!obj(parsed)) {
      addError(
        'JSON_ROOT_INVALID',
        `${label} debe tener un objeto en la raíz.`,
        rel(filePath),
      );

      return null;
    }

    return parsed;
  } catch (error) {
    addError(
      'JSON_INVALID',
      `${label} no contiene JSON válido: ${error.message}`,
      rel(filePath),
    );

    return null;
  }
}

async function readText(filePath, label) {
  if (!(await exists(filePath))) {
    addError(
      'FILE_MISSING',
      `Falta ${rel(filePath)}.`,
      rel(filePath),
    );

    return null;
  }

  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    addError(
      'FILE_UNREADABLE',
      `No se pudo leer ${label}: ${error.message}`,
      rel(filePath),
    );

    return null;
  }
}

async function markdownFiles(directoryPath) {
  if (!(await exists(directoryPath))) {
    addError(
      'DIRECTORY_MISSING',
      `Falta ${rel(directoryPath)}.`,
      rel(directoryPath),
    );

    return [];
  }

  try {
    return (await readdir(directoryPath, { withFileTypes: true }))
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith('.md'),
      )
      .map(
        (entry) =>
          `${rel(directoryPath)}/${entry.name}`,
      )
      .sort();
  } catch (error) {
    addError(
      'DIRECTORY_UNREADABLE',
      `No se pudo leer ${rel(directoryPath)}: ${error.message}`,
      rel(directoryPath),
    );

    return [];
  }
}

function normalizeRelative(value) {
  if (
    typeof value !== 'string' ||
    value.trim() === ''
  ) {
    return null;
  }

  const normalized = path
    .normalize(value.trim())
    .split(path.sep)
    .join('/')
    .replace(/^\.\//, '');

  if (
    path.isAbsolute(normalized) ||
    normalized === '..' ||
    normalized.startsWith('../')
  ) {
    return null;
  }

  return normalized;
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates].sort();
}

function indexById(records, label, filePath) {
  const map = new Map();

  for (const [index, record] of records.entries()) {
    if (!obj(record)) {
      addError(
        'RECORD_INVALID',
        `${label}[${index}] debe ser un objeto.`,
        rel(filePath),
        String(index),
      );

      continue;
    }

    if (
      typeof record.id !== 'string' ||
      record.id.trim() === ''
    ) {
      addError(
        'ID_MISSING',
        `${label}[${index}] no tiene id válido.`,
        rel(filePath),
        String(index),
      );

      continue;
    }

    if (map.has(record.id)) {
      addError(
        'ID_DUPLICATED',
        `${record.id} está duplicado en ${label}.`,
        rel(filePath),
        record.id,
      );

      continue;
    }

    map.set(record.id, record);
  }

  return map;
}

function validateRefs(
  values,
  validIds,
  code,
  prefix,
  file,
  reference,
) {
  for (const value of arr(values)) {
    if (
      typeof value !== 'string' ||
      value.trim() === ''
    ) {
      addError(
        `${code}_INVALID`,
        `${prefix}: referencia vacía o inválida.`,
        file,
        reference,
      );

      continue;
    }

    if (!validIds.has(value)) {
      addError(
        code,
        `${prefix}: ${value} no existe.`,
        file,
        reference,
      );
    }
  }
}

function validateStatus(
  value,
  allowedValues,
  label,
  filePath,
) {
  if (!allowedValues.includes(value)) {
    addError(
      'STATUS_INVALID',
      `${label}.status=${JSON.stringify(value)}; permitido: ${allowedValues.join(', ')}.`,
      rel(filePath),
    );
  }
}

function detectCycles(
  records,
  dependencyField,
  label,
  filePath,
) {
  const ids = new Set(
    records
      .filter(obj)
      .map((record) => record.id)
      .filter((id) => typeof id === 'string'),
  );

  const graph = new Map();

  for (const record of records) {
    if (
      !obj(record) ||
      typeof record.id !== 'string'
    ) {
      continue;
    }

    const dependencies = arr(
      record[dependencyField],
    ).filter((id) => ids.has(id));

    graph.set(record.id, dependencies);

    if (dependencies.includes(record.id)) {
      addError(
        'SELF_DEPENDENCY',
        `${record.id} depende de sí mismo.`,
        rel(filePath),
        record.id,
      );
    }
  }

  const state = new Map();
  const stack = [];
  const reported = new Set();

  function visit(id) {
    const currentState = state.get(id) ?? 0;

    if (currentState === 2) {
      return;
    }

    if (currentState === 1) {
      const start = stack.indexOf(id);
      const cycle = [
        ...stack.slice(start),
        id,
      ].join(' -> ');

      if (!reported.has(cycle)) {
        reported.add(cycle);

        addError(
          'DEPENDENCY_CYCLE',
          `Ciclo en ${label}: ${cycle}.`,
          rel(filePath),
          id,
        );
      }

      return;
    }

    state.set(id, 1);
    stack.push(id);

    for (
      const dependency of
      graph.get(id) ?? []
    ) {
      visit(dependency);
    }

    stack.pop();
    state.set(id, 2);
  }

  for (const id of graph.keys()) {
    visit(id);
  }
}

function ancestorResolver(tasks) {
  const graph = new Map(
    tasks
      .filter(obj)
      .map((task) => [
        task.id,
        arr(task.dependencyIds),
      ]),
  );

  const cache = new Map();

  function resolve(id, visiting = new Set()) {
    if (cache.has(id)) {
      return cache.get(id);
    }

    if (visiting.has(id)) {
      return new Set();
    }

    visiting.add(id);

    const result = new Set();

    for (
      const dependency of
      graph.get(id) ?? []
    ) {
      result.add(dependency);

      for (
        const ancestor of
        resolve(dependency, visiting)
      ) {
        result.add(ancestor);
      }
    }

    visiting.delete(id);
    cache.set(id, result);

    return result;
  }

  return resolve;
}


function expectedEpicGraph(epics, capabilities, tasks) {
  const epicMap = new Map(
    epics
      .filter(obj)
      .filter((epic) => typeof epic.id === 'string')
      .map((epic) => [epic.id, epic]),
  );

  const capabilityMap = new Map(
    capabilities
      .filter(obj)
      .filter((capability) => typeof capability.id === 'string')
      .map((capability) => [capability.id, capability]),
  );

  const taskMap = new Map(
    tasks
      .filter(obj)
      .filter((task) => typeof task.id === 'string')
      .map((task) => [task.id, task]),
  );

  const relationMap = new Map();

  function addRelation(
    consumerEpicId,
    providerEpicId,
    type,
    capabilityId = null,
    taskId = null,
  ) {
    if (
      !epicMap.has(consumerEpicId) ||
      !epicMap.has(providerEpicId) ||
      consumerEpicId === providerEpicId
    ) {
      return;
    }

    const key = `${consumerEpicId}::${providerEpicId}`;
    const relation = relationMap.get(key) ?? {
      fromEpicId: consumerEpicId,
      epicId: providerEpicId,
      types: new Set(),
      capabilityIds: new Set(),
      taskIds: new Set(),
    };

    relation.types.add(type);
    if (capabilityId) relation.capabilityIds.add(capabilityId);
    if (taskId) relation.taskIds.add(taskId);
    relationMap.set(key, relation);
  }

  for (const capability of capabilities) {
    if (
      !obj(capability) ||
      capability.implementationKind !== 'planned'
    ) {
      continue;
    }

    for (
      const requiredCapabilityId of
      arr(capability.requiredCapabilityIds)
    ) {
      const requiredCapability =
        capabilityMap.get(requiredCapabilityId);

      if (
        !requiredCapability ||
        requiredCapability.implementationKind !== 'planned'
      ) {
        continue;
      }

      addRelation(
        capability.ownerEpicId,
        requiredCapability.ownerEpicId,
        'capability',
        requiredCapabilityId,
        null,
      );
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    for (
      const dependencyTaskId of
      arr(task.dependencyIds)
    ) {
      const dependencyTask =
        taskMap.get(dependencyTaskId);

      if (!dependencyTask) continue;

      addRelation(
        task.epicId,
        dependencyTask.epicId,
        'task_dependency',
        null,
        dependencyTaskId,
      );
    }
  }

  const detailsByEpic = new Map();
  const dependenciesByEpic = new Map();

  for (const epicId of epicMap.keys()) {
    const details = [...relationMap.values()]
      .filter((relation) => relation.fromEpicId === epicId)
      .sort((left, right) =>
        left.epicId.localeCompare(right.epicId),
      )
      .map((relation) => ({
        epicId: relation.epicId,
        types: [...relation.types].sort(),
        capabilityIds: [...relation.capabilityIds].sort(),
        taskIds: [...relation.taskIds].sort(),
      }));

    detailsByEpic.set(epicId, details);
    dependenciesByEpic.set(
      epicId,
      details.map((detail) => detail.epicId),
    );
  }

  const visitState = new Map();
  const stack = [];
  let cycle = null;

  function visit(epicId) {
    if (cycle) return;

    const state = visitState.get(epicId) ?? 0;

    if (state === 2) return;

    if (state === 1) {
      const index = stack.indexOf(epicId);
      cycle = [...stack.slice(index), epicId];
      return;
    }

    visitState.set(epicId, 1);
    stack.push(epicId);

    for (
      const dependencyId of
      dependenciesByEpic.get(epicId) ?? []
    ) {
      visit(dependencyId);
    }

    stack.pop();
    visitState.set(epicId, 2);
  }

  for (const epicId of epicMap.keys()) {
    visit(epicId);
  }

  const waveByEpic = new Map();

  function waveOf(epicId) {
    if (waveByEpic.has(epicId)) {
      return waveByEpic.get(epicId);
    }

    const dependencies =
      dependenciesByEpic.get(epicId) ?? [];

    const wave = dependencies.length === 0
      ? 1
      : 1 + Math.max(
          ...dependencies.map(waveOf),
        );

    waveByEpic.set(epicId, wave);
    return wave;
  }

  const executionWaves = [];

  if (!cycle) {
    const groups = new Map();

    for (const epicId of epicMap.keys()) {
      const wave = waveOf(epicId);
      const members = groups.get(wave) ?? [];
      members.push(epicId);
      groups.set(wave, members);
    }

    for (
      const [wave, epicIds] of
      [...groups.entries()].sort(
        ([left], [right]) => left - right,
      )
    ) {
      executionWaves.push({
        wave,
        epicIds: epicIds.sort(),
      });
    }
  }

  return {
    relationCount: relationMap.size,
    detailsByEpic,
    dependenciesByEpic,
    cycle,
    waveByEpic,
    executionWaves,
    parallelCandidateCount:
      executionWaves
        .filter((item) => item.epicIds.length > 1)
        .reduce(
          (total, item) => total + item.epicIds.length,
          0,
        ),
  };
}

function sectionLines(markdown, heading) {
  if (typeof markdown !== 'string') {
    return [];
  }

  const lines = markdown.split(/\r?\n/);
  const result = [];
  let insideSection = false;

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      insideSection = line.trim() === heading;
      continue;
    }

    if (insideSection) {
      result.push(line);
    }
  }

  return result;
}

function definitionIdsInSection(
  markdown,
  heading,
  prefix,
) {
  const ids = [];

  const idPattern = new RegExp(
    '^(' +
      prefix +
      '-[A-Z0-9][A-Z0-9_-]*)' +
      '(?=\\s|[:|.)-]|$|\\*\\*|__|`)',
  );

  for (
    const originalLine of
    sectionLines(markdown, heading)
  ) {
    let line = originalLine.trim();

    line = line
      .replace(/^[-*+]\s+/, '')
      .replace(/^\[[ xX]\]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/^#{3,6}\s+/, '')
      .replace(/^\|\s*/, '')
      .replace(/^(\*\*|__|`)/, '');

    const match = line.match(idPattern);

    if (match) {
      ids.push(match[1]);
    }
  }

  return ids;
}

function normalizeComparableText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

function markdownSections(markdown) {
  const sections = new Map();

  if (typeof markdown !== 'string') {
    return sections;
  }

  const lines = markdown.split(/\r?\n/);
  const headings = [];

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);

    if (match) {
      headings.push({
        index,
        level: match[1].length,
        title: match[2].trim(),
      });
    }
  }

  for (const [position, heading] of headings.entries()) {
    let end = lines.length;

    for (
      let nextPosition = position + 1;
      nextPosition < headings.length;
      nextPosition += 1
    ) {
      const nextHeading = headings[nextPosition];

      if (nextHeading.level <= heading.level) {
        end = nextHeading.index;
        break;
      }
    }

    const key = normalizeComparableText(heading.title);

    if (!sections.has(key)) {
      sections.set(key, {
        ...heading,
        body: lines
          .slice(heading.index + 1, end)
          .join('\n'),
      });
    }
  }

  return sections;
}

function blueprintRequirementHeadings(markdown) {
  const records = new Map();
  const duplicates = new Set();

  if (typeof markdown !== 'string') {
    return { records, duplicates };
  }

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(
      /^###\s+(REQ-[A-Z0-9][A-Z0-9_-]*)\s*:\s*(.+?)\s*$/,
    );

    if (!match) {
      continue;
    }

    const [, id, title] = match;

    if (records.has(id)) {
      duplicates.add(id);
      continue;
    }

    records.set(id, {
      id,
      title: title.trim(),
    });
  }

  return { records, duplicates };
}


function normalizeHeader(value) {
  return normalizeComparableText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripMarkdownCell(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/^`+|`+$/g, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
}

function splitMarkdownTableRow(line) {
  if (typeof line !== 'string' || !line.trim().startsWith('|')) {
    return null;
  }

  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(stripMarkdownCell);
}

function isMarkdownTableSeparator(line) {
  const cells = splitMarkdownTableRow(line);
  return Boolean(
    cells &&
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell)),
  );
}

function blueprintFunctionCatalog(markdown) {
  const records = new Map();
  const duplicates = new Set();
  const issues = [];

  if (typeof markdown !== 'string') {
    return { records, duplicates, issues };
  }

  const lines = markdown.split(/\r?\n/);
  let currentHeading = null;

  for (let index = 0; index < lines.length; index += 1) {
    const headingMatch = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (headingMatch) {
      currentHeading = {
        level: headingMatch[1].length,
        title: headingMatch[2].trim(),
      };
      continue;
    }

    const headerCells = splitMarkdownTableRow(lines[index]);
    if (!headerCells || !isMarkdownTableSeparator(lines[index + 1] ?? '')) {
      continue;
    }

    const normalizedHeaders = headerCells.map(normalizeHeader);
    const functionIdIndex = normalizedHeaders.indexOf('function id');
    if (functionIdIndex < 0) {
      continue;
    }

    const operationKeyIndex = normalizedHeaders.findIndex((header) =>
      ['operation key', 'operation id', 'machine operation', 'operacion tecnica'].includes(header),
    );
    const sourceItemIndex = normalizedHeaders.findIndex((header) =>
      ['operacion', 'funcionalidad', 'funcion', 'source item'].includes(header),
    );
    const outcomeIndex = normalizedHeaders.findIndex((header) =>
      ['resultado observable', 'resultado', 'outcome'].includes(header),
    );
    const backendIndex = normalizedHeaders.findIndex((header) =>
      ['backend binding', 'comando backend', 'backend', 'backend command'].includes(header),
    );

    const requiredColumns = [
      ['Operation Key', operationKeyIndex],
      ['Operación', sourceItemIndex],
      ['Resultado observable', outcomeIndex],
      ['Backend Binding', backendIndex],
    ];

    for (const [label, columnIndex] of requiredColumns) {
      if (columnIndex < 0) {
        issues.push({
          code: 'BLUEPRINT_FUNCTION_COLUMN_MISSING',
          message: `La tabla funcional con Function ID no contiene la columna obligatoria ${label}.`,
          reference: currentHeading?.title ?? `línea ${index + 1}`,
        });
      }
    }

    let rowIndex = index + 2;
    while (rowIndex < lines.length) {
      const cells = splitMarkdownTableRow(lines[rowIndex]);
      if (!cells) {
        break;
      }

      const functionId = stripMarkdownCell(cells[functionIdIndex] ?? '');
      if (!/^FUN-[A-Z0-9][A-Z0-9_-]*$/.test(functionId)) {
        rowIndex += 1;
        continue;
      }

      const sectionTitle = currentHeading?.title ?? '';
      const requirementMatch = sectionTitle.match(/^(REQ-[A-Z0-9][A-Z0-9_-]*)\s*:/);
      const record = {
        sourceFunctionId: functionId,
        requirementId: requirementMatch?.[1] ?? null,
        sourceSection: sectionTitle,
        operation: operationKeyIndex >= 0 ? stripMarkdownCell(cells[operationKeyIndex] ?? '') : '',
        sourceItem: sourceItemIndex >= 0 ? stripMarkdownCell(cells[sourceItemIndex] ?? '') : '',
        outcome: outcomeIndex >= 0 ? stripMarkdownCell(cells[outcomeIndex] ?? '') : '',
        backendBinding: backendIndex >= 0 ? stripMarkdownCell(cells[backendIndex] ?? '') : '',
      };

      if (records.has(functionId)) {
        duplicates.add(functionId);
      } else {
        records.set(functionId, record);
      }

      rowIndex += 1;
    }
  }

  return { records, duplicates, issues };
}

function canonicalBehaviorId(sourceFunctionId) {
  if (typeof sourceFunctionId !== 'string' || !/^FUN-/.test(sourceFunctionId)) {
    return null;
  }

  return sourceFunctionId.replace(/^FUN-/, 'BEH-');
}

function canonicalSemanticKey(sourceFunctionId) {
  if (typeof sourceFunctionId !== 'string' || !/^FUN-/.test(sourceFunctionId)) {
    return null;
  }

  return sourceFunctionId
    .replace(/^FUN-/, '')
    .toLowerCase()
    .replace(/-+/g, '.');
}

function sortedUniqueStrings(values) {
  return [...new Set(arr(values).filter((value) => typeof value === 'string'))].sort();
}

function sameStringSet(left, right) {
  return JSON.stringify(sortedUniqueStrings(left)) === JSON.stringify(sortedUniqueStrings(right));
}

function markdownSectionBody(markdown, title) {
  const section = markdownSections(markdown).get(normalizeComparableText(title));
  return section?.body ?? null;
}

function parseSemanticBlock(markdown, taskId, file) {
  const body = markdownSectionBody(markdown, 'Contrato semántico');
  if (body === null) {
    addError(
      'TASK_SEMANTIC_BLOCK_MISSING',
      `${taskId} no contiene la sección ## Contrato semántico.`,
      file,
      taskId,
    );
    return null;
  }

  const match = body.match(/```json\s*([\s\S]*?)```/i);
  if (!match) {
    addError(
      'TASK_SEMANTIC_BLOCK_INVALID',
      `${taskId} no contiene un bloque JSON válido dentro de ## Contrato semántico.`,
      file,
      taskId,
    );
    return null;
  }

  try {
    const parsed = JSON.parse(match[1]);
    if (!obj(parsed)) {
      throw new Error('la raíz debe ser un objeto');
    }
    return parsed;
  } catch (error) {
    addError(
      'TASK_SEMANTIC_BLOCK_INVALID',
      `${taskId} tiene JSON inválido en ## Contrato semántico: ${error.message}.`,
      file,
      taskId,
    );
    return null;
  }
}

function isIsoTimestamp(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}


function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (obj(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function timestampDigest(document) {
  const clone = structuredClone(document);
  if (obj(clone.timestamps)) delete clone.timestamps.contentHash;
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical(clone))).digest('hex')}`;
}

function validateTimestampMetadata(document, filePath, label, { completed = false } = {}) {
  if (!document) return;
  const timestamps = document.timestamps;
  if (!obj(timestamps)) {
    addError('TIMESTAMPS_MISSING', `${label} debe contener timestamps.`, rel(filePath), 'timestamps');
    return;
  }
  if (!isIsoTimestamp(timestamps.createdAt)) {
    addError('CREATED_AT_INVALID', `${label}.timestamps.createdAt debe ser ISO válido.`, rel(filePath), 'timestamps.createdAt');
  }
  if (!isIsoTimestamp(timestamps.updatedAt)) {
    addError('UPDATED_AT_INVALID', `${label}.timestamps.updatedAt debe ser ISO válido.`, rel(filePath), 'timestamps.updatedAt');
  }
  if (isIsoTimestamp(timestamps.createdAt) && isIsoTimestamp(timestamps.updatedAt) && Date.parse(timestamps.createdAt) > Date.parse(timestamps.updatedAt)) {
    addError('TIMESTAMP_ORDER_INVALID', `${label}.createdAt no puede ser posterior a updatedAt.`, rel(filePath), 'timestamps');
  }
  if (typeof timestamps.contentHash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(timestamps.contentHash)) {
    addError('CONTENT_HASH_INVALID', `${label}.timestamps.contentHash debe ser sha256 válido.`, rel(filePath), 'timestamps.contentHash');
  } else if (timestamps.contentHash !== timestampDigest(document)) {
    addError('ARTIFACT_TIMESTAMP_DIGEST_MISMATCH', `${label} cambió sin ejecutar update-timestamps.mjs.`, rel(filePath), 'timestamps.contentHash');
  }
  if (isIsoTimestamp(timestamps.updatedAt) && Date.parse(timestamps.updatedAt) > Date.now() + 300000) {
    addError('TIMESTAMP_IN_FUTURE', `${label}.timestamps.updatedAt está en el futuro.`, rel(filePath), 'timestamps.updatedAt');
  }
  if (completed && timestamps.completedAt !== null && !isIsoTimestamp(timestamps.completedAt)) {
    addError('COMPLETED_AT_INVALID', `${label}.timestamps.completedAt debe ser null o ISO válido.`, rel(filePath), 'timestamps.completedAt');
  }
}

function decisionRecords(document) {
  if (!document) {
    return [];
  }

  if (Array.isArray(document.decisions)) {
    return document.decisions;
  }

  if (Array.isArray(document.items)) {
    return document.items;
  }

  addWarning(
    'DECISIONS_COLLECTION_UNKNOWN',
    'decisions.json no contiene decisions[] ni items[]; no se validarán referencias de decisiones.',
    rel(P.decisions),
  );

  return [];
}

function validateIndexFiles({
  records,
  actualFiles,
  expectedDirectory,
  label,
  filePath,
}) {
  const indexedFiles = [];

  for (const record of records) {
    if (
      !obj(record) ||
      typeof record.id !== 'string'
    ) {
      continue;
    }

    const normalized = normalizeRelative(
      record.file,
    );

    if (!normalized) {
      addError(
        'INDEX_FILE_INVALID',
        `${record.id} no tiene file válido.`,
        rel(filePath),
        record.id,
      );

      continue;
    }

    if (
      !normalized.startsWith(
        `${expectedDirectory}/`,
      )
    ) {
      addError(
        'INDEX_FILE_OUTSIDE_DIRECTORY',
        `${record.id} apunta fuera de ${expectedDirectory}: ${normalized}.`,
        rel(filePath),
        record.id,
      );
    }

    indexedFiles.push(normalized);
  }

  for (
    const duplicate of
    duplicateValues(indexedFiles)
  ) {
    addError(
      'INDEX_FILE_DUPLICATED',
      `${duplicate} está registrado más de una vez en ${label}.`,
      rel(filePath),
      duplicate,
    );
  }

  const indexedSet = new Set(indexedFiles);
  const actualSet = new Set(actualFiles);

  for (const indexedFile of indexedSet) {
    if (!actualSet.has(indexedFile)) {
      addError(
        'INDEXED_FILE_MISSING',
        `${indexedFile} está en ${label}, pero no existe.`,
        rel(filePath),
        indexedFile,
      );
    }
  }

  for (const actualFile of actualSet) {
    if (!indexedSet.has(actualFile)) {
      addError(
        'ORPHAN_FILE',
        `${actualFile} existe, pero no está en ${label}.`,
        actualFile,
      );
    }
  }
}

function compareCounter(
  state,
  field,
  expectedValue,
) {
  const actualValue =
    state?.progress?.[field];

  if (actualValue !== expectedValue) {
    addError(
      'COUNTER_MISMATCH',
      `progress.${field}=${JSON.stringify(actualValue)}, pero el valor real es ${expectedValue}.`,
      rel(P.state),
      field,
    );
  }
}

function formatIssue(issue) {
  const location = [
    issue.file,
    issue.reference,
  ]
    .filter(Boolean)
    .join(' · ');

  if (location) {
    return `- **${issue.code}** — ${issue.message} _(${location})_`;
  }

  return `- **${issue.code}** — ${issue.message}`;
}

async function writeOutputs({
  counts,
  statuses,
  state,
}) {
  const validatedAt = new Date().toISOString();

  const status =
    errors.length === 0
      ? 'passed'
      : 'failed';

  const readiness = {
    schemaVersion: 1,
    status,
    validatedAt,
    validator: {
      name: 'validate-plan.mjs',
      version: VALIDATOR_VERSION,
    },
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      ...counts,
    },
    blockingIssues: errors,
    warnings,
  };

  await writeFile(
    P.readiness,
    `${JSON.stringify(readiness, null, 2)}\n`,
    'utf8',
  );

  const lines = [
    '# Reporte de validación del plan',
    '',
    `- Estado: \`${status}\``,
    `- Fecha: \`${validatedAt}\``,
    `- Fase: \`${state?.workflow?.phase ?? 'desconocida'}\``,
    '',
    '## Conteos',
    '',
    `- Requisitos: ${counts.requirements}`,
    `- Requisitos MVP: ${counts.mvpRequirements}`,
    `- Requisitos MVP cubiertos: ${counts.coveredMvpRequirements}`,
    `- Funciones MVP detectadas: ${counts.mvpFunctions}`,
    `- Funciones MVP sin resolver: ${counts.unresolvedMvpFunctions}`,
    `- Behaviors MVP confirmados: ${counts.mvpBehaviors}`,
    `- Behaviors MVP cubiertos: ${counts.coveredMvpBehaviors}`,
    `- Capacidades: ${counts.capabilities}`,
    `- Épicas: ${counts.epics}`,
    `- Épicas descompuestas: ${counts.decomposedEpics}`,
    `- Tareas: ${counts.tasks}`,
    '',
    '## Estados de entrada',
    '',
    `- requirements.json: \`${statuses.requirements ?? 'desconocido'}\``,
    `- capability-map.json: \`${statuses.capabilities ?? 'desconocido'}\``,
    `- epic-plan.json: \`${statuses.epics ?? 'desconocido'}\``,
    `- task-plan.json: \`${statuses.tasks ?? 'desconocido'}\``,
    '',
    '## Errores bloqueantes',
    '',
    ...(
      errors.length
        ? errors.map(formatIssue)
        : ['- Ninguno.']
    ),
    '',
    '## Advertencias',
    '',
    ...(
      warnings.length
        ? warnings.map(formatIssue)
        : ['- Ninguna.']
    ),
    '',
    '## Resultado',
    '',
    status === 'passed'
      ? 'El plan cumple las validaciones deterministas implementadas por este script.'
      : 'El plan no puede avanzar a aprobación mientras existan errores bloqueantes.',
    '',
  ];

  await writeFile(
    P.report,
    `${lines.join('\n')}\n`,
    'utf8',
  );

  return status;
}

async function main() {
  const state = await readJson(
    P.state,
    'project-state.json',
  );

  const decisionsDocument = await readJson(
    P.decisions,
    'decisions.json',
  );

  const requirementsDocument = await readJson(
    P.requirements,
    'requirements.json',
  );

  const semanticDocument = await readJson(
    P.semantic,
    'semantic-contract.json',
  );

  const capabilitiesDocument = await readJson(
    P.capabilities,
    'capability-map.json',
  );

  const epicsDocument = await readJson(
    P.epics,
    'epic-plan.json',
  );

  const tasksDocument = await readJson(
    P.tasks,
    'task-plan.json',
  );

  const blueprint = await readText(
    P.blueprint,
    'SOFTWARE-BLUEPRINT-RESOLVED.md',
  );

  const blueprintSections =
    markdownSections(blueprint);

  const {
    records: blueprintRequirementMap,
    duplicates: duplicatedBlueprintRequirementIds,
  } = blueprintRequirementHeadings(blueprint);

  const {
    records: blueprintFunctionMap,
    duplicates: duplicatedBlueprintFunctionIds,
    issues: blueprintFunctionIssues,
  } = blueprintFunctionCatalog(blueprint);

  for (const issue of blueprintFunctionIssues) {
    addError(issue.code, issue.message, rel(P.blueprint), issue.reference);
  }

  for (const sourceFunctionId of duplicatedBlueprintFunctionIds) {
    addError(
      'BLUEPRINT_FUNCTION_ID_DUPLICATED',
      `${sourceFunctionId} aparece más de una vez en las tablas funcionales del blueprint.`,
      rel(P.blueprint),
      sourceFunctionId,
    );
  }

  const requirements = arr(
    requirementsDocument?.requirements,
  );

  const semanticContracts = arr(
    semanticDocument?.contracts,
  );

  const capabilities = arr(
    capabilitiesDocument?.capabilities,
  );

  const epics = arr(
    epicsDocument?.epics,
  );

  const tasks = arr(
    tasksDocument?.tasks,
  );

  const decisions = decisionRecords(
    decisionsDocument,
  );

  if (!['3.5', 3.5].includes(state?.planner?.validatorVersion)) {
    addError(
      'VALIDATOR_VERSION_MISMATCH',
      `project-state.json declara planner.validatorVersion=${JSON.stringify(state?.planner?.validatorVersion)}, pero este validador exige 3.5.`,
      rel(P.state),
      'planner.validatorVersion',
    );
  }

  if (state?.planner?.workflowVersion !== 7) {
    addError(
      'WORKFLOW_VERSION_MISMATCH',
      `project-state.json declara planner.workflowVersion=${JSON.stringify(state?.planner?.workflowVersion)}, pero validator 3.5 exige 7.`,
      rel(P.state),
      'planner.workflowVersion',
    );
  }

  if (state?.planner?.timestampToolVersion !== '1.0') {
    addError(
      'TIMESTAMP_TOOL_VERSION_MISMATCH',
      `project-state.json declara planner.timestampToolVersion=${JSON.stringify(state?.planner?.timestampToolVersion)}, pero se exige 1.0.`,
      rel(P.state),
      'planner.timestampToolVersion',
    );
  }


  if (state?.planner?.epicGraphVersion !== '1.0') {
    addError(
      'EPIC_GRAPH_VERSION_MISMATCH',
      `project-state.json declara planner.epicGraphVersion=${JSON.stringify(state?.planner?.epicGraphVersion)}, pero se exige 1.0.`,
      rel(P.state),
      'planner.epicGraphVersion',
    );
  }

  if (!(await exists(P.epicGraphBuilder))) {
    addError(
      'EPIC_GRAPH_BUILDER_MISSING',
      `Falta ${rel(P.epicGraphBuilder)}.`,
      rel(P.epicGraphBuilder),
    );
  }

  if (!(await exists(P.timestampUpdater))) {
    addError(
      'TIMESTAMP_TOOL_MISSING',
      `Falta ${rel(P.timestampUpdater)}.`,
      rel(P.timestampUpdater),
    );
  }

  validateTimestampMetadata(state, P.state, 'project-state.json', { completed: true });
  validateTimestampMetadata(decisionsDocument, P.decisions, 'decisions.json');
  validateTimestampMetadata(semanticDocument, P.semantic, 'semantic-contract.json');
  validateTimestampMetadata(requirementsDocument, P.requirements, 'requirements.json');
  validateTimestampMetadata(capabilitiesDocument, P.capabilities, 'capability-map.json');
  validateTimestampMetadata(epicsDocument, P.epics, 'epic-plan.json');
  validateTimestampMetadata(tasksDocument, P.tasks, 'task-plan.json');

  const stateUpdatedAt = state?.timestamps?.updatedAt;
  if (isIsoTimestamp(stateUpdatedAt)) {
    for (const [label, document, filePath] of [
      ['decisions.json', decisionsDocument, P.decisions],
      ['semantic-contract.json', semanticDocument, P.semantic],
      ['requirements.json', requirementsDocument, P.requirements],
      ['capability-map.json', capabilitiesDocument, P.capabilities],
      ['epic-plan.json', epicsDocument, P.epics],
      ['task-plan.json', tasksDocument, P.tasks],
    ]) {
      if (isIsoTimestamp(document?.timestamps?.updatedAt) && Date.parse(document.timestamps.updatedAt) > Date.parse(stateUpdatedAt)) {
        addError('PROJECT_STATE_TIMESTAMP_STALE', `project-state.updatedAt es anterior a ${label}.updatedAt.`, rel(P.state), 'timestamps.updatedAt');
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(state?.project || {}, 'executionMode')) {
    addError(
      'EXECUTION_MODE_DEPRECATED',
      'project.executionMode fue eliminado en Task Planner 3.4. Elimina el campo y usa el ciclo normal de aprobación y publicación.',
      rel(P.state),
      'project.executionMode',
    );
  }

  if (semanticDocument?.schemaVersion !== 1) {
    addError(
      'SEMANTIC_CONTRACT_SCHEMA_VERSION_INVALID',
      `semantic-contract.json debe usar schemaVersion=1, recibió ${JSON.stringify(semanticDocument?.schemaVersion)}.`,
      rel(P.semantic),
    );
  }

  validateStatus(
    semanticDocument?.status,
    ['approved', 'validated'],
    'semantic-contract.json',
    P.semantic,
  );

  if (requirementsDocument?.schemaVersion !== 3) {
    addError(
      'REQUIREMENTS_SCHEMA_VERSION_INVALID',
      `requirements.json debe usar schemaVersion=3, recibió ${JSON.stringify(requirementsDocument?.schemaVersion)}.`,
      rel(P.requirements),
    );
  }

  if (capabilitiesDocument?.schemaVersion !== 3) {
    addError(
      'CAPABILITY_MAP_SCHEMA_VERSION_INVALID',
      `capability-map.json debe usar schemaVersion=3, recibió ${JSON.stringify(capabilitiesDocument?.schemaVersion)}.`,
      rel(P.capabilities),
    );
  }

  if (epicsDocument?.schemaVersion !== 4) {
    addError(
      'EPIC_PLAN_SCHEMA_VERSION_INVALID',
      `epic-plan.json debe usar schemaVersion=4, recibió ${JSON.stringify(epicsDocument?.schemaVersion)}.`,
      rel(P.epics),
    );
  }

  if (tasksDocument?.schemaVersion !== 4) {
    addError(
      'TASK_PLAN_SCHEMA_VERSION_INVALID',
      `task-plan.json debe usar schemaVersion=4, recibió ${JSON.stringify(tasksDocument?.schemaVersion)}.`,
      rel(P.tasks),
    );
  }

  validateStatus(
    requirementsDocument?.status,
    ['generated', 'validated'],
    'requirements.json',
    P.requirements,
  );

  validateStatus(
    capabilitiesDocument?.status,
    ['generated', 'validated'],
    'capability-map.json',
    P.capabilities,
  );

  validateStatus(
    epicsDocument?.status,
    [
      'generated',
      'validated',
      'published',
    ],
    'epic-plan.json',
    P.epics,
  );

  validateStatus(
    tasksDocument?.status,
    [
      'in_progress',
      'validated',
      'published',
    ],
    'task-plan.json',
    P.tasks,
  );

  const requirementMap = indexById(
    requirements,
    'requirements',
    P.requirements,
  );

  const capabilityMap = indexById(
    capabilities,
    'capabilities',
    P.capabilities,
  );

  const epicMap = indexById(
    epics,
    'epics',
    P.epics,
  );

  const taskMap = indexById(
    tasks,
    'tasks',
    P.tasks,
  );

  const decisionMap = indexById(
    decisions,
    'decisions',
    P.decisions,
  );

  const semanticContractMap = new Map();
  const semanticKeyOwners = new Map();
  const sourceFunctionOwners = new Map();

  for (const [index, contract] of semanticContracts.entries()) {
    if (!obj(contract)) {
      addError(
        'SEMANTIC_CONTRACT_INVALID',
        `contracts[${index}] debe ser un objeto.`,
        rel(P.semantic),
        String(index),
      );
      continue;
    }

    const requiredFields = [
      'behaviorId',
      'semanticKey',
      'sourceFunctionId',
      'requirementId',
      'operation',
      'outcome',
      'sourceSection',
      'sourceItem',
      'scope',
      'backendBinding',
    ];

    for (const field of requiredFields) {
      if (typeof contract[field] !== 'string' || contract[field].trim() === '') {
        addError(
          'SEMANTIC_CONTRACT_FIELD_MISSING',
          `contracts[${index}] no tiene ${field}.`,
          rel(P.semantic),
          contract.behaviorId ?? String(index),
        );
      }
    }

    if (typeof contract.behaviorId !== 'string' || contract.behaviorId.trim() === '') {
      continue;
    }

    if (semanticContractMap.has(contract.behaviorId)) {
      addError(
        'SEMANTIC_CONTRACT_BEHAVIOR_DUPLICATED',
        `${contract.behaviorId} aparece más de una vez en semantic-contract.json.`,
        rel(P.semantic),
        contract.behaviorId,
      );
      continue;
    }

    semanticContractMap.set(contract.behaviorId, contract);

    const expectedBehaviorId = canonicalBehaviorId(contract.sourceFunctionId);
    if (expectedBehaviorId && contract.behaviorId !== expectedBehaviorId) {
      addError(
        'BEHAVIOR_ID_NOT_DERIVED_FROM_SOURCE_FUNCTION',
        `${contract.behaviorId} debe ser ${expectedBehaviorId} porque sourceFunctionId=${contract.sourceFunctionId}.`,
        rel(P.semantic),
        contract.behaviorId,
      );
    }

    const expectedSemanticKey = canonicalSemanticKey(contract.sourceFunctionId);
    if (expectedSemanticKey && contract.semanticKey !== expectedSemanticKey) {
      addError(
        'SEMANTIC_KEY_NOT_DERIVED_FROM_SOURCE_FUNCTION',
        `${contract.behaviorId} declara semanticKey=${JSON.stringify(contract.semanticKey)}, pero ${contract.sourceFunctionId} exige ${JSON.stringify(expectedSemanticKey)}.`,
        rel(P.semantic),
        contract.behaviorId,
      );
    }

    if (typeof contract.sourceFunctionId === 'string' && contract.sourceFunctionId.trim() !== '') {
      const prior = sourceFunctionOwners.get(contract.sourceFunctionId);
      if (prior && prior !== contract.behaviorId) {
        addError(
          'SOURCE_FUNCTION_MULTIPLE_CONTRACTS',
          `${contract.sourceFunctionId} pertenece a ${prior} y ${contract.behaviorId}.`,
          rel(P.semantic),
          contract.sourceFunctionId,
        );
      } else {
        sourceFunctionOwners.set(contract.sourceFunctionId, contract.behaviorId);
      }
    }

    if (typeof contract.semanticKey === 'string' && contract.semanticKey.trim() !== '') {
      const prior = semanticKeyOwners.get(contract.semanticKey);
      if (prior && prior !== contract.behaviorId) {
        addError(
          'SEMANTIC_KEY_DUPLICATED',
          `${contract.semanticKey} pertenece a ${prior} y ${contract.behaviorId}.`,
          rel(P.semantic),
          contract.semanticKey,
        );
      } else {
        semanticKeyOwners.set(contract.semanticKey, contract.behaviorId);
      }
    }
  }

  const requirementIds =
    new Set(requirementMap.keys());

  const behaviorMap = new Map();
  const behaviorRequirementIds = new Map();
  const unresolvedFunctions = [];

  for (const requirement of requirements) {
    if (!obj(requirement) || typeof requirement.id !== 'string') {
      continue;
    }

    for (const [index, behavior] of arr(requirement.behaviors).entries()) {
      if (!obj(behavior) || typeof behavior.id !== 'string' || behavior.id.trim() === '') {
        addError(
          'BEHAVIOR_ID_MISSING',
          `${requirement.id}.behaviors[${index}] no tiene id válido.`,
          rel(P.requirements),
          requirement.id,
        );
        continue;
      }

      if (behaviorMap.has(behavior.id)) {
        addError(
          'BEHAVIOR_ID_DUPLICATED',
          `${behavior.id} está duplicado en requirements.json.`,
          rel(P.requirements),
          behavior.id,
        );
        continue;
      }

      behaviorMap.set(behavior.id, behavior);
      behaviorRequirementIds.set(behavior.id, requirement.id);
    }

    for (const unresolved of arr(requirement.unresolvedFunctions)) {
      if (obj(unresolved)) {
        unresolvedFunctions.push({ requirementId: requirement.id, ...unresolved });
      }
    }
  }

  const behaviorIds = new Set(behaviorMap.keys());

  const capabilityIds =
    new Set(capabilityMap.keys());

  const epicIds =
    new Set(epicMap.keys());

  const taskIds =
    new Set(taskMap.keys());

  const decisionIds =
    new Set(decisionMap.keys());

  for (
    const requirementId of
    duplicatedBlueprintRequirementIds
  ) {
    addError(
      'BLUEPRINT_REQUIREMENT_ID_DUPLICATED',
      `${requirementId} aparece más de una vez como encabezado de trazabilidad en SOFTWARE-BLUEPRINT-RESOLVED.md.`,
      rel(P.blueprint),
      requirementId,
    );
  }

  const allowedScopes = new Set([
    'mvp',
    'post_mvp',
    'out_of_scope',
  ]);

  const allowedCapabilityTypes =
    new Set([
      'functional',
      'enabling',
      'non_functional',
      'external',
    ]);

  const allowedImplementationKinds =
    new Set([
      'planned',
      'preexisting',
      'external',
    ]);

  const reportedMissingSourceSections =
    new Set();

  for (const contract of semanticContracts) {
    if (!obj(contract) || typeof contract.behaviorId !== 'string') {
      continue;
    }

    if (!allowedScopes.has(contract.scope)) {
      addError(
        'SEMANTIC_CONTRACT_SCOPE_INVALID',
        `${contract.behaviorId} tiene scope=${JSON.stringify(contract.scope)}.`,
        rel(P.semantic),
        contract.behaviorId,
      );
    }

    const requirement = requirementMap.get(contract.requirementId);
    const behavior = behaviorMap.get(contract.behaviorId);

    if (!requirement) {
      addError(
        'SEMANTIC_CONTRACT_REQUIREMENT_UNKNOWN',
        `${contract.behaviorId} referencia ${contract.requirementId}, que no existe.`,
        rel(P.semantic),
        contract.behaviorId,
      );
    }

    if (!behavior) {
      addError(
        'SEMANTIC_CONTRACT_BEHAVIOR_UNKNOWN',
        `${contract.behaviorId} no existe en requirements.json.`,
        rel(P.semantic),
        contract.behaviorId,
      );
      continue;
    }

    const actualRequirementId = behaviorRequirementIds.get(contract.behaviorId);
    if (actualRequirementId !== contract.requirementId) {
      addError(
        'SEMANTIC_CONTRACT_REQUIREMENT_MISMATCH',
        `${contract.behaviorId} pertenece a ${actualRequirementId}, pero el contrato declara ${contract.requirementId}.`,
        rel(P.semantic),
        contract.behaviorId,
      );
    }

    const exactFields = [
      'semanticKey',
      'sourceFunctionId',
      'operation',
      'outcome',
      'sourceSection',
      'sourceItem',
      'scope',
      'backendBinding',
    ];

    for (const field of exactFields) {
      if (behavior[field] !== contract[field]) {
        addError(
          'BEHAVIOR_SEMANTIC_CONTRACT_MISMATCH',
          `${contract.behaviorId}.${field}=${JSON.stringify(behavior[field])}, pero el contrato semántico exige ${JSON.stringify(contract[field])}.`,
          rel(P.requirements),
          contract.behaviorId,
        );
      }
    }

    if (blueprint !== null && typeof contract.sourceSection === 'string') {
      const section = blueprintSections.get(normalizeComparableText(contract.sourceSection));
      if (!section) {
        addError(
          'SEMANTIC_SOURCE_SECTION_NOT_FOUND',
          `${contract.behaviorId} referencia la sección inexistente ${JSON.stringify(contract.sourceSection)}.`,
          rel(P.semantic),
          contract.behaviorId,
        );
      }
    }

    const sourceFunction = blueprintFunctionMap.get(contract.sourceFunctionId);
    if (!sourceFunction) {
      addError(
        'SOURCE_FUNCTION_NOT_IN_BLUEPRINT',
        `${contract.behaviorId} referencia ${JSON.stringify(contract.sourceFunctionId)}, que no existe en una tabla funcional del blueprint.`,
        rel(P.semantic),
        contract.behaviorId,
      );
    } else {
      const blueprintComparisons = [
        ['requirementId', sourceFunction.requirementId],
        ['sourceSection', sourceFunction.sourceSection],
        ['sourceItem', sourceFunction.sourceItem],
        ['operation', sourceFunction.operation],
        ['outcome', sourceFunction.outcome],
        ['backendBinding', sourceFunction.backendBinding],
      ];

      for (const [field, expected] of blueprintComparisons) {
        if (contract[field] !== expected) {
          addError(
            'SEMANTIC_BLUEPRINT_MISMATCH',
            `${contract.behaviorId}.${field}=${JSON.stringify(contract[field])}, pero ${contract.sourceFunctionId} en el blueprint exige ${JSON.stringify(expected)}.`,
            rel(P.semantic),
            contract.behaviorId,
          );
        }
      }
    }
  }

  for (const sourceFunctionId of blueprintFunctionMap.keys()) {
    if (!sourceFunctionOwners.has(sourceFunctionId)) {
      addError(
        'BLUEPRINT_FUNCTION_WITHOUT_SEMANTIC_CONTRACT',
        `${sourceFunctionId} existe en el blueprint, pero no tiene contrato semántico.`,
        rel(P.semantic),
        sourceFunctionId,
      );
    }
  }

  for (const [behaviorId] of behaviorMap) {
    if (!semanticContractMap.has(behaviorId)) {
      addError(
        'BEHAVIOR_WITHOUT_SEMANTIC_CONTRACT',
        `${behaviorId} no tiene contrato en semantic-contract.json.`,
        rel(P.requirements),
        behaviorId,
      );
    }
  }

  for (const requirement of requirements) {
    if (
      !obj(requirement) ||
      typeof requirement.id !== 'string'
    ) {
      continue;
    }

    let requirementSourceSection = null;

    if (
      !allowedScopes.has(requirement.scope)
    ) {
      addError(
        'REQUIREMENT_SCOPE_INVALID',
        `${requirement.id} tiene scope=${JSON.stringify(requirement.scope)}.`,
        rel(P.requirements),
        requirement.id,
      );
    }

    if (
      typeof requirement.title !== 'string' ||
      requirement.title.trim() === ''
    ) {
      addError(
        'REQUIREMENT_TITLE_MISSING',
        `${requirement.id} no tiene title.`,
        rel(P.requirements),
        requirement.id,
      );
    }

    if (blueprint !== null) {
      const blueprintRequirement =
        blueprintRequirementMap.get(
          requirement.id,
        );

      if (!blueprintRequirement) {
        addError(
          'REQUIREMENT_NOT_IN_RESOLVED_BLUEPRINT',
          `${requirement.id} no aparece como encabezado de trazabilidad en SOFTWARE-BLUEPRINT-RESOLVED.md.`,
          rel(P.blueprint),
          requirement.id,
        );
      } else if (
        normalizeComparableText(
          requirement.title,
        ) !==
        normalizeComparableText(
          blueprintRequirement.title,
        )
      ) {
        addError(
          'REQUIREMENT_TITLE_MISMATCH',
          `${requirement.id} tiene title=${JSON.stringify(requirement.title)}, pero el blueprint declara ${JSON.stringify(blueprintRequirement.title)}.`,
          rel(P.blueprint),
          requirement.id,
        );
      }
    }

    if (
      typeof requirement.sourceSection !== 'string' ||
      requirement.sourceSection.trim() === ''
    ) {
      addError(
        'REQUIREMENT_SOURCE_MISSING',
        `${requirement.id} no tiene sourceSection.`,
        rel(P.requirements),
        requirement.id,
      );
    } else if (blueprint !== null) {
      const sourceKey = normalizeComparableText(
        requirement.sourceSection,
      );

      requirementSourceSection =
        blueprintSections.get(sourceKey) ?? null;

      if (
        !requirementSourceSection &&
        !reportedMissingSourceSections.has(sourceKey)
      ) {
        reportedMissingSourceSections.add(sourceKey);
        addError(
          'SOURCE_SECTION_NOT_FOUND',
          `La sección fuente ${JSON.stringify(requirement.sourceSection)} no existe como encabezado en SOFTWARE-BLUEPRINT-RESOLVED.md.`,
          rel(P.blueprint),
          requirement.sourceSection,
        );
      }
    }

    if (!Array.isArray(requirement.behaviors)) {
      addError(
        'REQUIREMENT_BEHAVIORS_MISSING',
        `${requirement.id} no tiene behaviors[].`,
        rel(P.requirements),
        requirement.id,
      );
    }

    if (!Array.isArray(requirement.unresolvedFunctions)) {
      addError(
        'REQUIREMENT_UNRESOLVED_FUNCTIONS_MISSING',
        `${requirement.id} no tiene unresolvedFunctions[].`,
        rel(P.requirements),
        requirement.id,
      );
    }

    for (const behavior of arr(requirement.behaviors)) {
      if (!obj(behavior) || typeof behavior.id !== 'string') continue;

      for (const field of ['semanticKey', 'sourceFunctionId', 'operation', 'outcome', 'sourceSection', 'sourceItem', 'backendBinding']) {
        if (typeof behavior[field] !== 'string' || behavior[field].trim() === '') {
          addError(
            'BEHAVIOR_FIELD_MISSING',
            `${behavior.id} no tiene ${field} válido.`,
            rel(P.requirements),
            behavior.id,
          );
        }
      }

      if (!allowedScopes.has(behavior.scope)) {
        addError('BEHAVIOR_SCOPE_INVALID', `${behavior.id} tiene scope=${JSON.stringify(behavior.scope)}.`, rel(P.requirements), behavior.id);
      }

      if (!['confirmed', 'pending'].includes(behavior.confirmationStatus)) {
        addError('BEHAVIOR_CONFIRMATION_INVALID', `${behavior.id} tiene confirmationStatus inválido.`, rel(P.requirements), behavior.id);
      }

      if (
        typeof behavior.sourceSection === 'string' &&
        typeof requirement.sourceSection === 'string' &&
        normalizeComparableText(behavior.sourceSection) !==
          normalizeComparableText(requirement.sourceSection)
      ) {
        addError(
          'BEHAVIOR_SOURCE_SECTION_MISMATCH',
          `${behavior.id} usa sourceSection=${JSON.stringify(behavior.sourceSection)}, pero su requisito ${requirement.id} usa ${JSON.stringify(requirement.sourceSection)}.`,
          rel(P.requirements),
          behavior.id,
        );
      }

      if (
        requirementSourceSection &&
        typeof behavior.sourceItem === 'string' &&
        behavior.sourceItem.trim() !== '' &&
        !normalizeComparableText(
          requirementSourceSection.body,
        ).includes(
          normalizeComparableText(
            behavior.sourceItem,
          ),
        )
      ) {
        addError(
          'BEHAVIOR_SOURCE_ITEM_NOT_FOUND',
          `${behavior.id} referencia sourceItem=${JSON.stringify(behavior.sourceItem)}, pero no aparece dentro de ${JSON.stringify(requirement.sourceSection)}.`,
          rel(P.blueprint),
          behavior.id,
        );
      }

      if (behavior.scope !== requirement.scope && requirement.scope !== 'mvp') {
        addWarning('BEHAVIOR_SCOPE_DIFFERS_FROM_REQUIREMENT', `${behavior.id} usa scope ${behavior.scope} dentro de ${requirement.id} (${requirement.scope}).`, rel(P.requirements), behavior.id);
      }
    }

    for (const [index, unresolved] of arr(requirement.unresolvedFunctions).entries()) {
      if (!obj(unresolved)) {
        addError('UNRESOLVED_FUNCTION_INVALID', `${requirement.id}.unresolvedFunctions[${index}] debe ser objeto.`, rel(P.requirements), requirement.id);
        continue;
      }
      if (!['aggregate', 'ambiguous'].includes(unresolved.classification)) {
        addError('UNRESOLVED_FUNCTION_CLASS_INVALID', `${requirement.id} tiene una función sin resolver con clasificación inválida.`, rel(P.requirements), requirement.id);
      }
      for (const field of ['sourceSection', 'sourceItem', 'reason']) {
        if (typeof unresolved[field] !== 'string' || unresolved[field].trim() === '') {
          addError('UNRESOLVED_FUNCTION_FIELD_MISSING', `${requirement.id}.unresolvedFunctions[${index}] no tiene ${field}.`, rel(P.requirements), requirement.id);
        }
      }
      if (!allowedScopes.has(unresolved.scope)) {
        addError('UNRESOLVED_FUNCTION_SCOPE_INVALID', `${requirement.id}.unresolvedFunctions[${index}] tiene scope inválido.`, rel(P.requirements), requirement.id);
      }
      if (unresolved.scope === 'mvp') {
        addError('MVP_FUNCTION_UNRESOLVED', `${requirement.id} mantiene sin resolver la función MVP ${JSON.stringify(unresolved.sourceItem)}.`, rel(P.requirements), requirement.id);
      }
    }

    validateRefs(
      requirement.decisionIds,
      decisionIds,
      'REQUIREMENT_DECISION_UNKNOWN',
      `${requirement.id} referencia una decisión inexistente`,
      rel(P.requirements),
      requirement.id,
    );

  }

  if (blueprint !== null) {
    for (
      const requirementId of
      blueprintRequirementMap.keys()
    ) {
      if (!requirementIds.has(requirementId)) {
        addError(
          'BLUEPRINT_REQUIREMENT_MISSING_FROM_CATALOG',
          `${requirementId} aparece en la trazabilidad del blueprint, pero no existe en requirements.json.`,
          rel(P.blueprint),
          requirementId,
        );
      }
    }
  }

  const plannedCapabilities =
    capabilities.filter(
      (capability) =>
        capability?.implementationKind ===
        'planned',
    );

  const plannedCapabilityIds =
    new Set(
      plannedCapabilities.map(
        (capability) => capability.id,
      ),
    );

  for (const capability of capabilities) {
    if (
      !obj(capability) ||
      typeof capability.id !== 'string'
    ) {
      continue;
    }

    if (
      !allowedCapabilityTypes.has(
        capability.type,
      )
    ) {
      addError(
        'CAPABILITY_TYPE_INVALID',
        `${capability.id} tiene type=${JSON.stringify(capability.type)}.`,
        rel(P.capabilities),
        capability.id,
      );
    }

    if (
      !allowedImplementationKinds.has(
        capability.implementationKind,
      )
    ) {
      addError(
        'CAPABILITY_KIND_INVALID',
        `${capability.id} tiene implementationKind=${JSON.stringify(capability.implementationKind)}.`,
        rel(P.capabilities),
        capability.id,
      );
    }

    if (
      typeof capability.logicalOwner !== 'string' ||
      capability.logicalOwner.trim() === ''
    ) {
      addError(
        'CAPABILITY_LOGICAL_OWNER_MISSING',
        `${capability.id} no tiene logicalOwner.`,
        rel(P.capabilities),
        capability.id,
      );
    } else if (
      capability.logicalOwner === capability.id
    ) {
      addError(
        'CAPABILITY_SELF_OWNED',
        `${capability.id} usa su propio ID como logicalOwner.`,
        rel(P.capabilities),
        capability.id,
      );
    }

    if (
      /\bcrud\b|gesti[oó]n completa|administraci[oó]n completa/i.test(
        `${capability.name ?? ''} ${capability.result ?? ''}`,
      )
    ) {
      addError(
        'CAPABILITY_TOO_BROAD',
        `${capability.id} parece agrupar comportamientos separables.`,
        rel(P.capabilities),
        capability.id,
      );
    }

    validateRefs(
      capability.requirementIds,
      requirementIds,
      'CAPABILITY_REQUIREMENT_UNKNOWN',
      `${capability.id} referencia un requisito inexistente`,
      rel(P.capabilities),
      capability.id,
    );

    validateRefs(
      capability.decisionIds,
      decisionIds,
      'CAPABILITY_DECISION_UNKNOWN',
      `${capability.id} referencia una decisión inexistente`,
      rel(P.capabilities),
      capability.id,
    );

    validateRefs(
      capability.requiredCapabilityIds,
      capabilityIds,
      'CAPABILITY_DEPENDENCY_UNKNOWN',
      `${capability.id} requiere una capacidad inexistente`,
      rel(P.capabilities),
      capability.id,
    );

    validateRefs(
      capability.consumerCapabilityIds,
      capabilityIds,
      'CAPABILITY_CONSUMER_UNKNOWN',
      `${capability.id} declara un consumidor inexistente`,
      rel(P.capabilities),
      capability.id,
    );

    if (
      arr(
        capability.requiredCapabilityIds,
      ).includes(capability.id)
    ) {
      addError(
        'CAPABILITY_SELF_DEPENDENCY',
        `${capability.id} se requiere a sí misma.`,
        rel(P.capabilities),
        capability.id,
      );
    }

    if (
      capability.implementationKind ===
      'planned'
    ) {
      if (
        typeof capability.ownerEpicId !== 'string' ||
        capability.ownerEpicId.trim() === ''
      ) {
        addError(
          'CAPABILITY_OWNER_EPIC_MISSING',
          `${capability.id} no tiene ownerEpicId.`,
          rel(P.capabilities),
          capability.id,
        );
      } else if (
        !epicIds.has(capability.ownerEpicId)
      ) {
        addError(
          'CAPABILITY_OWNER_EPIC_UNKNOWN',
          `${capability.id} declara ownerEpicId=${capability.ownerEpicId}, pero no existe.`,
          rel(P.capabilities),
          capability.id,
        );
      }

      if (
        typeof capability.ownerTaskId !== 'string' ||
        capability.ownerTaskId.trim() === ''
      ) {
        addError(
          'CAPABILITY_OWNER_TASK_MISSING',
          `${capability.id} no tiene ownerTaskId.`,
          rel(P.capabilities),
          capability.id,
        );
      } else if (
        !taskIds.has(capability.ownerTaskId)
      ) {
        addError(
          'CAPABILITY_OWNER_TASK_UNKNOWN',
          `${capability.id} declara ownerTaskId=${capability.ownerTaskId}, pero no existe.`,
          rel(P.capabilities),
          capability.id,
        );
      }
    }
  }

  detectCycles(
    capabilities,
    'requiredCapabilityIds',
    'capabilities',
    P.capabilities,
  );

  const functionalCapabilityOwnersByBehavior = new Map();

  for (const capability of capabilities) {
    if (!obj(capability) || typeof capability.id !== 'string') {
      continue;
    }

    const declaredBehaviorIds = arr(capability.behaviorIds);
    const declaredSemanticKeys = arr(capability.semanticKeys);

    if (capability.type === 'functional') {
      if (declaredBehaviorIds.length !== 1) {
        addError(
          'FUNCTIONAL_CAPABILITY_BEHAVIOR_COUNT_INVALID',
          `${capability.id} debe declarar exactamente un behaviorId; recibió ${declaredBehaviorIds.length}.`,
          rel(P.capabilities),
          capability.id,
        );
      }

      if (declaredSemanticKeys.length !== 1) {
        addError(
          'FUNCTIONAL_CAPABILITY_SEMANTIC_KEY_COUNT_INVALID',
          `${capability.id} debe declarar exactamente un semanticKey; recibió ${declaredSemanticKeys.length}.`,
          rel(P.capabilities),
          capability.id,
        );
      }

      if (declaredBehaviorIds.length === 0) {
        addError(
          'FUNCTIONAL_CAPABILITY_BEHAVIORS_EMPTY',
          `${capability.id} no declara behaviorIds.`,
          rel(P.capabilities),
          capability.id,
        );
      }

      const expectedSemanticKeys = [];
      for (const behaviorId of declaredBehaviorIds) {
        const contract = semanticContractMap.get(behaviorId);
        if (!contract) {
          addError(
            'CAPABILITY_SEMANTIC_BEHAVIOR_UNKNOWN',
            `${capability.id} referencia ${behaviorId}, que no tiene contrato semántico.`,
            rel(P.capabilities),
            capability.id,
          );
          continue;
        }

        expectedSemanticKeys.push(contract.semanticKey);

        if (declaredBehaviorIds.length === 1 && capability.result !== contract.outcome) {
          addError(
            'CAPABILITY_OUTCOME_MISMATCH',
            `${capability.id}.result=${JSON.stringify(capability.result)}, pero ${behaviorId} exige ${JSON.stringify(contract.outcome)}.`,
            rel(P.capabilities),
            capability.id,
          );
        }

        if (!arr(capability.requirementIds).includes(contract.requirementId)) {
          addError(
            'CAPABILITY_SEMANTIC_REQUIREMENT_MISMATCH',
            `${capability.id} implementa ${behaviorId}, pero no declara ${contract.requirementId} en requirementIds.`,
            rel(P.capabilities),
            capability.id,
          );
        }

        if (capability.implementationKind === 'planned') {
          const owners = functionalCapabilityOwnersByBehavior.get(behaviorId) ?? [];
          owners.push(capability.id);
          functionalCapabilityOwnersByBehavior.set(behaviorId, owners);
        }
      }

      const actualSet = [...new Set(declaredSemanticKeys)].sort();
      const expectedSet = [...new Set(expectedSemanticKeys)].sort();
      if (JSON.stringify(actualSet) !== JSON.stringify(expectedSet)) {
        addError(
          'CAPABILITY_SEMANTIC_KEYS_MISMATCH',
          `${capability.id} declara semanticKeys=[${actualSet.join(', ')}], pero sus behaviors exigen [${expectedSet.join(', ')}].`,
          rel(P.capabilities),
          capability.id,
        );
      }
    } else if (declaredBehaviorIds.length > 0 || declaredSemanticKeys.length > 0) {
      addError(
        'NON_FUNCTIONAL_CAPABILITY_HAS_SEMANTICS',
        `${capability.id} es ${capability.type}, pero declara behaviorIds o semanticKeys funcionales.`,
        rel(P.capabilities),
        capability.id,
      );
    }
  }

  for (const [behaviorId, owners] of functionalCapabilityOwnersByBehavior.entries()) {
    if (owners.length > 1) {
      addError(
        'BEHAVIOR_MULTIPLE_FUNCTIONAL_CAPABILITIES',
        `${behaviorId} es implementado por varias capacidades: ${owners.sort().join(', ')}.`,
        rel(P.capabilities),
        behaviorId,
      );
    }
  }

  for (const [behaviorId, contract] of semanticContractMap.entries()) {
    if (contract.scope !== 'mvp') {
      continue;
    }
    const owners = functionalCapabilityOwnersByBehavior.get(behaviorId) ?? [];
    if (owners.length === 0) {
      addError(
        'MVP_BEHAVIOR_WITHOUT_FUNCTIONAL_CAPABILITY',
        `${behaviorId} no tiene capacidad funcional planned propietaria.`,
        rel(P.capabilities),
        behaviorId,
      );
    }
  }

  for (const epic of epics) {
    if (
      !obj(epic) ||
      typeof epic.id !== 'string'
    ) {
      continue;
    }

    validateRefs(
      epic.dependencyIds,
      epicIds,
      'EPIC_DEPENDENCY_UNKNOWN',
      `${epic.id} depende de una épica inexistente`,
      rel(P.epics),
      epic.id,
    );

    validateRefs(
      epic.capabilityIds,
      capabilityIds,
      'EPIC_CAPABILITY_UNKNOWN',
      `${epic.id} incluye una capacidad inexistente`,
      rel(P.epics),
      epic.id,
    );

    validateRefs(
      epic.requirementIds,
      requirementIds,
      'EPIC_REQUIREMENT_UNKNOWN',
      `${epic.id} referencia un requisito inexistente`,
      rel(P.epics),
      epic.id,
    );

    validateRefs(
      epic.decisionIds,
      decisionIds,
      'EPIC_DECISION_UNKNOWN',
      `${epic.id} referencia una decisión inexistente`,
      rel(P.epics),
      epic.id,
    );

    validateRefs(
      epic.taskIds,
      taskIds,
      'EPIC_TASK_UNKNOWN',
      `${epic.id} referencia una tarea inexistente`,
      rel(P.epics),
      epic.id,
    );

    if (!Array.isArray(epic.behaviorIds)) {
      addError(
        'EPIC_BEHAVIORS_MISSING',
        `${epic.id}.behaviorIds debe ser un arreglo.`,
        rel(P.epics),
        epic.id,
      );
    }

    validateRefs(
      epic.behaviorIds,
      behaviorIds,
      'EPIC_BEHAVIOR_UNKNOWN',
      `${epic.id} referencia un behavior inexistente`,
      rel(P.epics),
      epic.id,
    );

    for (const duplicate of duplicateValues(arr(epic.behaviorIds))) {
      addError(
        'EPIC_BEHAVIOR_DUPLICATED',
        `${epic.id} repite ${duplicate} en behaviorIds.`,
        rel(P.epics),
        epic.id,
      );
    }

    if (epic.splitReason !== null && epic.splitReason !== undefined) {
      const allowedSplitTypes = new Set([
        'independent_delivery',
        'distinct_actor',
        'distinct_surface',
        'deployment_boundary',
        'dependency_boundary',
        'task_count_limit',
        'enabling_foundation',
      ]);

      if (!obj(epic.splitReason)) {
        addError(
          'EPIC_SPLIT_REASON_INVALID',
          `${epic.id}.splitReason debe ser null o un objeto.`,
          rel(P.epics),
          epic.id,
        );
      } else {
        if (!allowedSplitTypes.has(epic.splitReason.type)) {
          addError(
            'EPIC_SPLIT_REASON_TYPE_INVALID',
            `${epic.id}.splitReason.type=${JSON.stringify(epic.splitReason.type)} no está permitido.`,
            rel(P.epics),
            epic.id,
          );
        }

        if (typeof epic.splitReason.description !== 'string' || epic.splitReason.description.trim() === '') {
          addError(
            'EPIC_SPLIT_REASON_DESCRIPTION_MISSING',
            `${epic.id}.splitReason no tiene description válida.`,
            rel(P.epics),
            epic.id,
          );
        }

        if (typeof epic.splitReason.decisionId !== 'string' || epic.splitReason.decisionId.trim() === '') {
          addError(
            'EPIC_SPLIT_REASON_DECISION_MISSING',
            `${epic.id}.splitReason no tiene decisionId válido.`,
            rel(P.epics),
            epic.id,
          );
        } else {
          if (!decisionIds.has(epic.splitReason.decisionId)) {
            addError(
              'EPIC_SPLIT_REASON_DECISION_UNKNOWN',
              `${epic.id}.splitReason.decisionId=${epic.splitReason.decisionId} no existe.`,
              rel(P.epics),
              epic.id,
            );
          }

          if (!arr(epic.decisionIds).includes(epic.splitReason.decisionId)) {
            addError(
              'EPIC_SPLIT_REASON_DECISION_NOT_REFERENCED',
              `${epic.id} no incluye ${epic.splitReason.decisionId} en decisionIds.`,
              rel(P.epics),
              epic.id,
            );
          }
        }
      }
    }

    if (epic.decomposed !== true) {
      addError(
        'EPIC_NOT_DECOMPOSED',
        `${epic.id} no está descompuesta.`,
        rel(P.epics),
        epic.id,
      );
    }
  }

  detectCycles(
    epics,
    'dependencyIds',
    'epics',
    P.epics,
  );


  const epicGraph = expectedEpicGraph(
    epics,
    capabilities,
    tasks,
  );

  if (epicGraph.cycle) {
    addError(
      'EPIC_DEPENDENCY_CYCLE',
      `El grafo derivado de épicas contiene un ciclo: ${epicGraph.cycle.join(' -> ')}.`,
      rel(P.epics),
      epicGraph.cycle[0],
    );
  }

  if (!obj(epicsDocument?.graph)) {
    addError(
      'EPIC_GRAPH_METADATA_MISSING',
      'epic-plan.json.graph debe ser un objeto generado por build-epic-graph.mjs.',
      rel(P.epics),
      'graph',
    );
  } else {
    if (epicsDocument.graph.version !== '1.0') {
      addError(
        'EPIC_GRAPH_METADATA_VERSION_INVALID',
        `epic-plan.json.graph.version=${JSON.stringify(epicsDocument.graph.version)}, se exige 1.0.`,
        rel(P.epics),
        'graph.version',
      );
    }

    if (!['generated', 'validated'].includes(epicsDocument.graph.status)) {
      addError(
        'EPIC_GRAPH_STATUS_INVALID',
        `epic-plan.json.graph.status=${JSON.stringify(epicsDocument.graph.status)}, permitido: generated, validated.`,
        rel(P.epics),
        'graph.status',
      );
    }

    if (epicsDocument.graph.dependencyCount !== epicGraph.relationCount) {
      addError(
        'EPIC_GRAPH_DEPENDENCY_COUNT_MISMATCH',
        `epic-plan.json.graph.dependencyCount=${JSON.stringify(epicsDocument.graph.dependencyCount)}, pero el grafo derivado contiene ${epicGraph.relationCount}.`,
        rel(P.epics),
        'graph.dependencyCount',
      );
    }

    if (epicsDocument.graph.waveCount !== epicGraph.executionWaves.length) {
      addError(
        'EPIC_GRAPH_WAVE_COUNT_MISMATCH',
        `epic-plan.json.graph.waveCount=${JSON.stringify(epicsDocument.graph.waveCount)}, pero se derivan ${epicGraph.executionWaves.length} waves.`,
        rel(P.epics),
        'graph.waveCount',
      );
    }

    if (epicsDocument.graph.parallelCandidateCount !== epicGraph.parallelCandidateCount) {
      addError(
        'EPIC_GRAPH_PARALLEL_COUNT_MISMATCH',
        `epic-plan.json.graph.parallelCandidateCount=${JSON.stringify(epicsDocument.graph.parallelCandidateCount)}, pero se derivan ${epicGraph.parallelCandidateCount}.`,
        rel(P.epics),
        'graph.parallelCandidateCount',
      );
    }
  }

  if (!Array.isArray(epicsDocument?.executionWaves)) {
    addError(
      'EPIC_EXECUTION_WAVES_MISSING',
      'epic-plan.json.executionWaves debe ser un arreglo.',
      rel(P.epics),
      'executionWaves',
    );
  } else if (
    JSON.stringify(epicsDocument.executionWaves) !==
    JSON.stringify(epicGraph.executionWaves)
  ) {
    addError(
      'EPIC_EXECUTION_WAVES_MISMATCH',
      `executionWaves no coincide con el orden topológico derivado. Esperado: ${JSON.stringify(epicGraph.executionWaves)}.`,
      rel(P.epics),
      'executionWaves',
    );
  }

  const allowedEpicDependencyTypes = new Set([
    'capability',
    'task_dependency',
  ]);

  for (const epic of epics) {
    if (!obj(epic) || typeof epic.id !== 'string') continue;

    const expectedDetails = epicGraph.detailsByEpic.get(epic.id) ?? [];
    const expectedDependencyIds = expectedDetails.map((detail) => detail.epicId);

    for (const duplicate of duplicateValues(arr(epic.dependencyIds))) {
      addError(
        'EPIC_DEPENDENCY_DUPLICATED',
        `${epic.id} repite ${duplicate} en dependencyIds.`,
        rel(P.epics),
        epic.id,
      );
    }

    if (arr(epic.dependencyIds).includes(epic.id)) {
      addError(
        'EPIC_DEPENDENCY_SELF_REFERENCE',
        `${epic.id} no puede depender de sí misma.`,
        rel(P.epics),
        epic.id,
      );
    }

    if (!sameStringSet(epic.dependencyIds, expectedDependencyIds)) {
      addError(
        'EPIC_DEPENDENCY_GRAPH_MISMATCH',
        `${epic.id}.dependencyIds=${JSON.stringify(sortedUniqueStrings(epic.dependencyIds))}, pero las dependencias derivadas son ${JSON.stringify(expectedDependencyIds)}.`,
        rel(P.epics),
        epic.id,
      );
    }

    if (!Array.isArray(epic.dependencyDetails)) {
      addError(
        'EPIC_DEPENDENCY_DETAILS_MISSING',
        `${epic.id}.dependencyDetails debe ser un arreglo.`,
        rel(P.epics),
        epic.id,
      );
    } else {
      const detailMap = new Map();

      for (const [index, detail] of epic.dependencyDetails.entries()) {
        if (!obj(detail) || typeof detail.epicId !== 'string') {
          addError(
            'EPIC_DEPENDENCY_DETAIL_INVALID',
            `${epic.id}.dependencyDetails[${index}] no es válido.`,
            rel(P.epics),
            epic.id,
          );
          continue;
        }

        if (detailMap.has(detail.epicId)) {
          addError(
            'EPIC_DEPENDENCY_DETAIL_DUPLICATED',
            `${epic.id} repite el detalle de dependencia hacia ${detail.epicId}.`,
            rel(P.epics),
            epic.id,
          );
        }
        detailMap.set(detail.epicId, detail);

        if (typeof detail.reason !== 'string' || detail.reason.trim() === '') {
          addError(
            'EPIC_DEPENDENCY_REASON_MISSING',
            `${epic.id} no explica su dependencia hacia ${detail.epicId}.`,
            rel(P.epics),
            epic.id,
          );
        }

        for (const type of arr(detail.types)) {
          if (!allowedEpicDependencyTypes.has(type)) {
            addError(
              'EPIC_DEPENDENCY_TYPE_INVALID',
              `${epic.id} usa type=${JSON.stringify(type)} para ${detail.epicId}.`,
              rel(P.epics),
              epic.id,
            );
          }
        }
      }

      for (const expected of expectedDetails) {
        const actual = detailMap.get(expected.epicId);
        if (!actual) {
          addError(
            'EPIC_DEPENDENCY_DETAIL_MISSING',
            `${epic.id} no incluye el detalle de dependencia hacia ${expected.epicId}.`,
            rel(P.epics),
            epic.id,
          );
          continue;
        }

        if (
          !sameStringSet(actual.types, expected.types) ||
          !sameStringSet(actual.capabilityIds, expected.capabilityIds) ||
          !sameStringSet(actual.taskIds, expected.taskIds)
        ) {
          addError(
            'EPIC_DEPENDENCY_DETAIL_MISMATCH',
            `${epic.id} describe de forma distinta la dependencia hacia ${expected.epicId}.`,
            rel(P.epics),
            epic.id,
          );
        }
      }

      for (const detail of epic.dependencyDetails) {
        if (
          obj(detail) &&
          typeof detail.epicId === 'string' &&
          !expectedDependencyIds.includes(detail.epicId)
        ) {
          addError(
            'EPIC_DEPENDENCY_DETAIL_UNEXPECTED',
            `${epic.id} declara un detalle no derivado hacia ${detail.epicId}.`,
            rel(P.epics),
            epic.id,
          );
        }
      }
    }

    const expectedWave = epicGraph.waveByEpic.get(epic.id);
    if (epic.executionWave !== expectedWave) {
      addError(
        'EPIC_EXECUTION_WAVE_MISMATCH',
        `${epic.id}.executionWave=${JSON.stringify(epic.executionWave)}, pero corresponde wave=${expectedWave}.`,
        rel(P.epics),
        epic.id,
      );
    }
  }

  if (state?.progress?.epicDependenciesDetected !== epicGraph.relationCount) {
    addError(
      'EPIC_DEPENDENCY_PROGRESS_MISMATCH',
      `progress.epicDependenciesDetected=${JSON.stringify(state?.progress?.epicDependenciesDetected)}, pero se derivan ${epicGraph.relationCount}.`,
      rel(P.state),
      'progress.epicDependenciesDetected',
    );
  }

  if (state?.progress?.executionWavesGenerated !== epicGraph.executionWaves.length) {
    addError(
      'EPIC_WAVE_PROGRESS_MISMATCH',
      `progress.executionWavesGenerated=${JSON.stringify(state?.progress?.executionWavesGenerated)}, pero se derivan ${epicGraph.executionWaves.length}.`,
      rel(P.state),
      'progress.executionWavesGenerated',
    );
  }

  if (state?.progress?.parallelEpicCandidates !== epicGraph.parallelCandidateCount) {
    addError(
      'EPIC_PARALLEL_PROGRESS_MISMATCH',
      `progress.parallelEpicCandidates=${JSON.stringify(state?.progress?.parallelEpicCandidates)}, pero se derivan ${epicGraph.parallelCandidateCount}.`,
      rel(P.state),
      'progress.parallelEpicCandidates',
    );
  }

  if (state?.progress?.epicGraphValidated !== true) {
    addError(
      'EPIC_GRAPH_NOT_VALIDATED',
      'progress.epicGraphValidated debe ser true después de ejecutar build-epic-graph.mjs.',
      rel(P.state),
      'progress.epicGraphValidated',
    );
  }

  const epicOwnersByCapability =
    new Map();

  for (const epic of epics) {
    if (
      !obj(epic) ||
      typeof epic.id !== 'string'
    ) {
      continue;
    }

    for (
      const capabilityId of
      arr(epic.capabilityIds)
    ) {
      const owners =
        epicOwnersByCapability.get(
          capabilityId,
        ) ?? [];

      owners.push(epic.id);

      epicOwnersByCapability.set(
        capabilityId,
        owners,
      );
    }
  }

  for (
    const capability of
    plannedCapabilities
  ) {
    const owners =
      epicOwnersByCapability.get(
        capability.id,
      ) ?? [];

    if (owners.length === 0) {
      addError(
        'CAPABILITY_WITHOUT_EPIC',
        `${capability.id} no pertenece a ninguna épica.`,
        rel(P.epics),
        capability.id,
      );
    } else if (owners.length > 1) {
      addError(
        'CAPABILITY_MULTIPLE_EPICS',
        `${capability.id} pertenece a varias épicas: ${owners.join(', ')}.`,
        rel(P.epics),
        capability.id,
      );
    } else if (
      capability.ownerEpicId !== owners[0]
    ) {
      addError(
        'CAPABILITY_OWNER_EPIC_MISMATCH',
        `${capability.id} declara ownerEpicId=${capability.ownerEpicId}, pero epic-plan.json la asigna a ${owners[0]}.`,
        rel(P.capabilities),
        capability.id,
      );
    }
  }

  for (
    const capabilityId of
    epicOwnersByCapability.keys()
  ) {
    if (
      !plannedCapabilityIds.has(
        capabilityId,
      )
    ) {
      addError(
        'NON_PLANNED_CAPABILITY_IN_EPIC',
        `${capabilityId} aparece en una épica, pero no es planned.`,
        rel(P.epics),
        capabilityId,
      );
    }
  }

  const epicOwnersByBehavior = new Map();
  const epicsByRequirement = new Map();

  for (const epic of epics) {
    if (!obj(epic) || typeof epic.id !== 'string') continue;

    const expectedBehaviorIds = [];

    for (const capabilityId of arr(epic.capabilityIds)) {
      const capability = capabilityMap.get(capabilityId);
      if (!capability || capability.type !== 'functional' || capability.implementationKind !== 'planned') {
        continue;
      }
      expectedBehaviorIds.push(...arr(capability.behaviorIds));
    }

    if (!sameStringSet(epic.behaviorIds, expectedBehaviorIds)) {
      addError(
        'EPIC_CAPABILITY_BEHAVIOR_MISMATCH',
        `${epic.id}.behaviorIds=${JSON.stringify(sortedUniqueStrings(epic.behaviorIds))}, pero sus capacidades funcionales exigen ${JSON.stringify(sortedUniqueStrings(expectedBehaviorIds))}.`,
        rel(P.epics),
        epic.id,
      );
    }

    if (expectedBehaviorIds.length > 0 && arr(epic.behaviorIds).length === 0) {
      addError(
        'EPIC_WITHOUT_BEHAVIORS',
        `${epic.id} contiene capacidades funcionales pero no declara behaviorIds.`,
        rel(P.epics),
        epic.id,
      );
    }

    for (const behaviorId of arr(epic.behaviorIds)) {
      const owners = epicOwnersByBehavior.get(behaviorId) ?? [];
      owners.push(epic.id);
      epicOwnersByBehavior.set(behaviorId, owners);

      const contract = semanticContractMap.get(behaviorId);
      if (contract && !arr(epic.requirementIds).includes(contract.requirementId)) {
        addError(
          'EPIC_BEHAVIOR_REQUIREMENT_MISMATCH',
          `${epic.id} declara ${behaviorId}, que pertenece a ${contract.requirementId}, pero ese requisito no está en requirementIds.`,
          rel(P.epics),
          epic.id,
        );
      }
    }

    const functionalRequirementIds = sortedUniqueStrings(
      arr(epic.behaviorIds)
        .map((behaviorId) => semanticContractMap.get(behaviorId)?.requirementId)
        .filter(Boolean),
    );

    for (const requirementId of functionalRequirementIds) {
      const ids = epicsByRequirement.get(requirementId) ?? [];
      ids.push(epic.id);
      epicsByRequirement.set(requirementId, ids);
    }
  }

  for (const [behaviorId, contract] of semanticContractMap.entries()) {
    if (contract.scope !== 'mvp') continue;
    const owners = epicOwnersByBehavior.get(behaviorId) ?? [];

    if (owners.length === 0) {
      addError(
        'MVP_BEHAVIOR_WITHOUT_EPIC',
        `${behaviorId} no pertenece a ninguna épica.`,
        rel(P.epics),
        behaviorId,
      );
    } else if (owners.length > 1) {
      addError(
        'BEHAVIOR_MULTIPLE_EPICS',
        `${behaviorId} pertenece a varias épicas: ${owners.sort().join(', ')}.`,
        rel(P.epics),
        behaviorId,
      );
    }
  }

  for (const [requirementId, ownerEpicIds] of epicsByRequirement.entries()) {
    const uniqueEpicIds = sortedUniqueStrings(ownerEpicIds);
    if (uniqueEpicIds.length <= 1) continue;

    for (const epicId of uniqueEpicIds) {
      const epic = epicMap.get(epicId);
      if (!obj(epic?.splitReason)) {
        addError(
          'EPIC_REQUIREMENT_FRAGMENTATION_UNJUSTIFIED',
          `${requirementId} fue dividido entre ${uniqueEpicIds.join(', ')}, pero ${epicId} no tiene splitReason respaldado por decisión.`,
          rel(P.epics),
          requirementId,
        );
      }
    }
  }

  const creatorsByCapability =
    new Map();

  const tasksByEpic =
    new Map();

  const markdownByTask =
    new Map();

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    validateRefs(
      [task.epicId],
      epicIds,
      'TASK_EPIC_UNKNOWN',
      `${task.id} pertenece a una épica inexistente`,
      rel(P.tasks),
      task.id,
    );

    validateRefs(
      task.dependencyIds,
      taskIds,
      'TASK_DEPENDENCY_UNKNOWN',
      `${task.id} depende de una tarea inexistente`,
      rel(P.tasks),
      task.id,
    );

    validateRefs(
      task.createsCapabilityIds,
      capabilityIds,
      'TASK_CREATED_CAPABILITY_UNKNOWN',
      `${task.id} crea una capacidad inexistente`,
      rel(P.tasks),
      task.id,
    );

    validateRefs(
      task.consumesCapabilityIds,
      capabilityIds,
      'TASK_CONSUMED_CAPABILITY_UNKNOWN',
      `${task.id} consume una capacidad inexistente`,
      rel(P.tasks),
      task.id,
    );

    if (
      [
        'functional',
        'enabling',
      ].includes(task.type) &&
      arr(
        task.createsCapabilityIds,
      ).length !== 1
    ) {
      addError(
        'TASK_PRIMARY_CAPABILITY_COUNT_INVALID',
        `${task.id} de tipo ${task.type} debe crear exactamente una capacidad principal.`,
        rel(P.tasks),
        task.id,
      );
    }

    for (
      const capabilityId of
      arr(task.createsCapabilityIds)
    ) {
      const creators =
        creatorsByCapability.get(
          capabilityId,
        ) ?? [];

      creators.push(task.id);

      creatorsByCapability.set(
        capabilityId,
        creators,
      );
    }

    const epicTasks =
      tasksByEpic.get(task.epicId) ?? [];

    epicTasks.push(task.id);

    tasksByEpic.set(task.epicId, epicTasks);

    if (typeof task.file === 'string') {
      const normalized = normalizeRelative(
        task.file,
      );

      if (normalized) {
        markdownByTask.set(task.id, normalized);
      }
    }
  }

  for (
    const [capabilityId, creators] of
    creatorsByCapability.entries()
  ) {
    if (creators.length === 0) {
      addError(
        'CAPABILITY_WITHOUT_TASK',
        `${capabilityId} no es creada por ninguna tarea.`,
        rel(P.tasks),
        capabilityId,
      );
    } else if (creators.length > 1) {
      addError(
        'CAPABILITY_MULTIPLE_TASKS',
        `${capabilityId} es creada por varias tareas: ${creators.join(', ')}.`,
        rel(P.tasks),
        capabilityId,
      );
    }
  }

  for (
    const capability of
    plannedCapabilities
  ) {
    const creators =
      creatorsByCapability.get(
        capability.id,
      ) ?? [];

    if (
      capability.implementationKind ===
        'planned' &&
      creators.length === 0
    ) {
      addError(
        'PLANNED_CAPABILITY_WITHOUT_TASK',
        `${capability.id} es planned pero no es creada por ninguna tarea.`,
        rel(P.tasks),
        capability.id,
      );
    } else if (
      capability.implementationKind ===
        'planned' &&
      creators.length > 0 &&
      capability.ownerTaskId !== creators[0]
    ) {
      addError(
        'CAPABILITY_OWNER_TASK_MISMATCH',
        `${capability.id} declara ownerTaskId=${capability.ownerTaskId}, pero task-plan.json la asigna a ${creators[0]}.`,
        rel(P.capabilities),
        capability.id,
      );
    }
  }

  const taskMarkdownFiles =
    await markdownFiles(P.taskDir);

  const epicMarkdownFiles =
    await markdownFiles(P.epicDir);

  validateIndexFiles({
    records: epics,
    actualFiles: epicMarkdownFiles,
    expectedDirectory: '.devflow/task-planner/epics',
    label: 'epic-plan.json',
    filePath: P.epics,
  });

  validateIndexFiles({
    records: tasks,
    actualFiles: taskMarkdownFiles,
    expectedDirectory: '.devflow/task-planner/tasks',
    label: 'task-plan.json',
    filePath: P.tasks,
  });

  for (const epic of epics) {
    if (
      !obj(epic) ||
      typeof epic.id !== 'string'
    ) {
      continue;
    }

    const expectedTasks =
      tasksByEpic.get(epic.id) ?? [];

    const actualTasks = arr(epic.taskIds);

    const expectedSet =
      [...new Set(expectedTasks)].sort();

    const actualSet =
      [...new Set(actualTasks)].sort();

    if (
      JSON.stringify([...expectedSet]) !==
      JSON.stringify([...actualSet])
    ) {
      addError(
        'EPIC_TASK_MISMATCH',
        `${epic.id} declara taskIds=${JSON.stringify(actualTasks)}, pero las tareas reales son ${JSON.stringify(expectedTasks)}.`,
        rel(P.epics),
        epic.id,
      );
    }
  }

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    if (
      !['functional', 'enabling', 'non_functional', 'external'].includes(
        task.type,
      )
    ) {
      addError(
        'TASK_TYPE_INVALID',
        `${task.id} tiene type=${JSON.stringify(task.type)}.`,
        rel(P.tasks),
        task.id,
      );
    }

    if (
      typeof task.title !== 'string' ||
      task.title.trim() === ''
    ) {
      addError(
        'TASK_TITLE_MISSING',
        `${task.id} no tiene title.`,
        rel(P.tasks),
        task.id,
      );
    }

    if (typeof task.file !== 'string') {
      addError(
        'TASK_FILE_MISSING',
        `${task.id} no tiene file.`,
        rel(P.tasks),
        task.id,
      );
    } else {
      const normalized = normalizeRelative(
        task.file,
      );

      if (!normalized) {
        addError(
          'TASK_FILE_INVALID',
          `${task.id} tiene file inválido: ${task.file}.`,
          rel(P.tasks),
          task.id,
        );
      } else if (
        !normalized.startsWith(
          '.devflow/task-planner/tasks/',
        )
      ) {
        addError(
          'TASK_FILE_OUTSIDE_DIRECTORY',
          `${task.id} apunta fuera de .devflow/task-planner/tasks/: ${normalized}.`,
          rel(P.tasks),
          task.id,
        );
      }
    }
  }


  for (const task of tasks) {
    if (!obj(task) || typeof task.id !== 'string') {
      continue;
    }

    const normalized = normalizeRelative(task.file);
    if (!normalized) {
      continue;
    }

    const absolutePath = path.join(ROOT, normalized);
    const markdown = await readText(absolutePath, `${task.id} Markdown`);
    if (markdown === null) {
      continue;
    }

    const requiredHeadings = [
      'Objetivo',
      'Capacidades creadas',
      'Capacidades consumidas',
      'Alcance',
      'Fuera de alcance',
      'Criterios de aceptación',
      'Pruebas',
      'Contrato semántico',
    ];

    for (const heading of requiredHeadings) {
      if (markdownSectionBody(markdown, heading) === null) {
        addError(
          'TASK_SECTION_MISSING',
          `${task.id} no contiene ## ${heading}.`,
          normalized,
          task.id,
        );
      }
    }

    const titleMatch = markdown.match(/^#\s+(TASK-[A-Z0-9_-]+)\s+[—-]\s+(.+?)\s*$/m);
    if (!titleMatch || titleMatch[1] !== task.id) {
      addError(
        'TASK_ID_NOT_IN_MARKDOWN',
        `${task.id} no aparece correctamente en el encabezado principal.`,
        normalized,
        task.id,
      );
    } else if (normalizeComparableText(titleMatch[2]) !== normalizeComparableText(task.title)) {
      addError(
        'TASK_TITLE_MISMATCH',
        `${task.id} tiene title=${JSON.stringify(task.title)}, pero el Markdown declara ${JSON.stringify(titleMatch[2])}.`,
        normalized,
        task.id,
      );
    }

    const createdIds = definitionIdsInSection(markdown, '## Capacidades creadas', 'CAP');
    const consumedIds = definitionIdsInSection(markdown, '## Capacidades consumidas', 'CAP');
    if (!sameStringSet(createdIds, task.createsCapabilityIds)) {
      addError(
        'TASK_CREATED_CAPABILITIES_MARKDOWN_MISMATCH',
        `${task.id} declara createsCapabilityIds=${JSON.stringify(arr(task.createsCapabilityIds))}, pero el Markdown contiene ${JSON.stringify(createdIds)}.`,
        normalized,
        task.id,
      );
    }
    if (!sameStringSet(consumedIds, task.consumesCapabilityIds)) {
      addError(
        'TASK_CONSUMED_CAPABILITIES_MARKDOWN_MISMATCH',
        `${task.id} declara consumesCapabilityIds=${JSON.stringify(arr(task.consumesCapabilityIds))}, pero el Markdown contiene ${JSON.stringify(consumedIds)}.`,
        normalized,
        task.id,
      );
    }

    const scopeIds = definitionIdsInSection(markdown, '## Alcance', 'SCOPE');
    const acceptanceIds = definitionIdsInSection(markdown, '## Criterios de aceptación', 'AC');
    if (task.type === 'functional') {
      const expectedScopeIds = arr(task.requirementCoverage).flatMap((coverage) => arr(coverage?.scopeItemIds));
      const expectedAcceptanceIds = arr(task.requirementCoverage).flatMap((coverage) => arr(coverage?.acceptanceCriterionIds));
      if (!sameStringSet(scopeIds, expectedScopeIds)) {
        addError(
          'TASK_SCOPE_MARKDOWN_MISMATCH',
          `${task.id} declara scopeItemIds=${JSON.stringify(expectedScopeIds)}, pero el Markdown contiene ${JSON.stringify(scopeIds)}.`,
          normalized,
          task.id,
        );
      }
      if (!sameStringSet(acceptanceIds, expectedAcceptanceIds)) {
        addError(
          'TASK_ACCEPTANCE_MARKDOWN_MISMATCH',
          `${task.id} declara acceptanceCriterionIds=${JSON.stringify(expectedAcceptanceIds)}, pero el Markdown contiene ${JSON.stringify(acceptanceIds)}.`,
          normalized,
          task.id,
        );
      }
    }

    const semanticBlock = parseSemanticBlock(markdown, task.id, normalized);
    if (semanticBlock) {
      const expectedSourceFunctionIds = arr(task.behaviorIds)
        .map((behaviorId) => semanticContractMap.get(behaviorId)?.sourceFunctionId)
        .filter(Boolean);
      const expectedBackendBindings = arr(task.behaviorIds)
        .map((behaviorId) => semanticContractMap.get(behaviorId)?.backendBinding)
        .filter(Boolean);

      const blockFields = [
        ['behaviorIds', task.behaviorIds],
        ['semanticKeys', task.semanticKeys],
        ['sourceFunctionIds', expectedSourceFunctionIds],
        ['backendBindings', expectedBackendBindings],
      ];

      for (const [field, expected] of blockFields) {
        if (!Array.isArray(semanticBlock[field]) || !sameStringSet(semanticBlock[field], expected)) {
          addError(
            'TASK_SEMANTIC_BLOCK_MISMATCH',
            `${task.id}.${field}=${JSON.stringify(semanticBlock[field])}, pero se exige ${JSON.stringify(sortedUniqueStrings(expected))}.`,
            normalized,
            task.id,
          );
        }
      }

      for (const binding of expectedBackendBindings) {
        if (!markdown.includes(binding)) {
          addError(
            'TASK_BACKEND_BINDING_MISSING',
            `${task.id} no contiene el backendBinding canónico ${JSON.stringify(binding)}.`,
            normalized,
            task.id,
          );
        }
      }

      const foreignBindings = semanticContracts
        .filter((contract) => !arr(task.behaviorIds).includes(contract.behaviorId))
        .map((contract) => contract.backendBinding)
        .filter((binding) => typeof binding === 'string' && binding.trim() !== '');

      for (const binding of foreignBindings) {
        if (markdown.includes(binding)) {
          addError(
            'TASK_FOREIGN_BACKEND_BINDING',
            `${task.id} contiene el backendBinding de otro behavior: ${JSON.stringify(binding)}.`,
            normalized,
            task.id,
          );
        }
      }
    }
  }

  const allCapabilityOwners =
    new Map();

  for (
    const [capabilityId, creators] of
    creatorsByCapability.entries()
  ) {
    for (const taskId of creators) {
      const owners =
        allCapabilityOwners.get(
          capabilityId,
        ) ?? [];

      owners.push(taskId);

      allCapabilityOwners.set(
        capabilityId,
        owners,
      );
    }
  }

  for (
    const capability of
    plannedCapabilities
  ) {
    const owners =
      allCapabilityOwners.get(
        capability.id,
      ) ?? [];

    if (
      owners.length === 0 &&
      capability.implementationKind ===
        'planned'
    ) {
      addError(
        'PLANNED_CAPABILITY_WITHOUT_CREATOR',
        `${capability.id} es planned pero ninguna tarea la crea.`,
        rel(P.tasks),
        capability.id,
      );
    } else if (owners.length > 1) {
      addError(
        'CAPABILITY_MULTIPLE_CREATORS',
        `${capability.id} es creada por varias tareas: ${owners.join(', ')}.`,
        rel(P.tasks),
        capability.id,
      );
    }
  }

  const epicCapabilityOwnership =
    new Map();

  for (const epic of epics) {
    if (
      !obj(epic) ||
      typeof epic.id !== 'string'
    ) {
      continue;
    }

    for (
      const capabilityId of
      arr(epic.capabilityIds)
    ) {
      const owners =
        epicCapabilityOwnership.get(
          capabilityId,
        ) ?? [];

      owners.push(epic.id);

      epicCapabilityOwnership.set(
        capabilityId,
        owners,
      );
    }
  }

  for (
    const capability of
    plannedCapabilities
  ) {
    const epicOwners =
      epicCapabilityOwnership.get(
        capability.id,
      ) ?? [];

    if (epicOwners.length === 0) {
      addError(
        'PLANNED_CAPABILITY_WITHOUT_EPIC',
        `${capability.id} es planned pero no pertenece a ninguna épica.`,
        rel(P.epics),
        capability.id,
      );
    } else if (epicOwners.length > 1) {
      addError(
        'CAPABILITY_MULTIPLE_EPICS',
        `${capability.id} pertenece a varias épicas: ${epicOwners.join(', ')}.`,
        rel(P.epics),
        capability.id,
      );
    } else if (
      capability.ownerEpicId !== epicOwners[0]
    ) {
      addError(
        'CAPABILITY_OWNER_EPIC_MISMATCH',
        `${capability.id} declara ownerEpicId=${capability.ownerEpicId}, pero epic-plan.json la asigna a ${epicOwners[0]}.`,
        rel(P.capabilities),
        capability.id,
      );
    }
  }

  for (
    const capabilityId of
    epicCapabilityOwnership.keys()
  ) {
    if (
      !plannedCapabilityIds.has(
        capabilityId,
      )
    ) {
      addError(
        'NON_PLANNED_CAPABILITY_IN_EPIC',
        `${capabilityId} aparece en una épica, pero no es planned.`,
        rel(P.epics),
        capabilityId,
      );
    }
  }

  const allTaskCapabilityOwnership =
    new Map();

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    for (
      const capabilityId of
      arr(task.createsCapabilityIds)
    ) {
      const owners =
        allTaskCapabilityOwnership.get(
          capabilityId,
        ) ?? [];

      owners.push(task.id);

      allTaskCapabilityOwnership.set(
        capabilityId,
        owners,
      );
    }
  }

  for (
    const capability of
    plannedCapabilities
  ) {
    const taskOwners =
      allTaskCapabilityOwnership.get(
        capability.id,
      ) ?? [];

    if (taskOwners.length === 0) {
      addError(
        'PLANNED_CAPABILITY_WITHOUT_TASK_CREATOR',
        `${capability.id} es planned pero ninguna tarea la crea.`,
        rel(P.tasks),
        capability.id,
      );
    } else if (taskOwners.length > 1) {
      addError(
        'CAPABILITY_MULTIPLE_TASK_CREATORS',
        `${capability.id} es creada por varias tareas: ${taskOwners.join(', ')}.`,
        rel(P.tasks),
        capability.id,
      );
    } else if (
      capability.ownerTaskId !== taskOwners[0]
    ) {
      addError(
        'CAPABILITY_OWNER_TASK_MISMATCH',
        `${capability.id} declara ownerTaskId=${capability.ownerTaskId}, pero task-plan.json la asigna a ${taskOwners[0]}.`,
        rel(P.capabilities),
        capability.id,
      );
    }
  }

  const mvpBehaviors =
    [...semanticContractMap.entries()]
      .filter(
        ([, contract]) =>
          contract.scope === 'mvp',
      )
      .map(
        ([behaviorId]) => behaviorId,
      );

  const coveredMvpBehaviors = [];

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    for (
      const behaviorId of
      arr(task.behaviorIds)
    ) {
      if (
        mvpBehaviors.includes(behaviorId) &&
        !coveredMvpBehaviors.includes(
          behaviorId,
        )
      ) {
        coveredMvpBehaviors.push(behaviorId);
      }
    }
  }

  const uncoveredMvpBehaviors =
    mvpBehaviors.filter(
      (id) =>
        !coveredMvpBehaviors.includes(id),
    );

  for (
    const behaviorId of
    uncoveredMvpBehaviors
  ) {
    addError(
      'MVP_BEHAVIOR_NOT_COVERED_BY_TASK',
      `${behaviorId} es MVP pero no aparece en behaviorIds de ninguna tarea.`,
      rel(P.tasks),
      behaviorId,
    );
  }

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    if (
      task.type === 'functional' &&
      arr(task.behaviorIds).length === 0
    ) {
      addError(
        'FUNCTIONAL_TASK_BEHAVIORS_EMPTY',
        `${task.id} es functional pero no declara behaviorIds.`,
        rel(P.tasks),
        task.id,
      );
    }

    if (
      task.type === 'functional' &&
      arr(task.semanticKeys).length === 0
    ) {
      addError(
        'FUNCTIONAL_TASK_SEMANTIC_KEYS_EMPTY',
        `${task.id} es functional pero no declara semanticKeys.`,
        rel(P.tasks),
        task.id,
      );
    }

    for (
      const behaviorId of
      arr(task.behaviorIds)
    ) {
      const contract =
        semanticContractMap.get(
          behaviorId,
        );

      if (!contract) {
        addError(
          'TASK_BEHAVIOR_UNKNOWN',
          `${task.id} referencia ${behaviorId}, que no tiene contrato semántico.`,
          rel(P.tasks),
          task.id,
        );
        continue;
      }

      if (
        task.type === 'functional'
      ) {
        const expectedSemanticKey =
          contract.semanticKey;

        if (
          !arr(
            task.semanticKeys,
          ).includes(
            expectedSemanticKey,
          )
        ) {
          addError(
            'TASK_SEMANTIC_KEY_MISMATCH',
            `${task.id} referencia ${behaviorId}, pero no declara su semanticKey ${expectedSemanticKey}.`,
            rel(P.tasks),
            task.id,
          );
        }
      }
    }

    const createdCapability =
      arr(
        task.createsCapabilityIds,
      ).length === 1
        ? capabilityMap.get(
            arr(
              task.createsCapabilityIds,
            )[0],
          )
        : null;

    if (
      task.type === 'functional' &&
      createdCapability
    ) {
      const taskBehaviorIds =
        new Set(
          arr(task.behaviorIds),
        );

      const capabilityBehaviorIds =
        new Set(
          arr(
            createdCapability.behaviorIds,
          ),
        );

      if (
        JSON.stringify(
          [...taskBehaviorIds].sort(),
        ) !==
        JSON.stringify(
          [...capabilityBehaviorIds].sort(),
        )
      ) {
        addError(
          'TASK_CAPABILITY_BEHAVIOR_MISMATCH',
          `${task.id} declara behaviors ${JSON.stringify(arr(task.behaviorIds))}, pero su capacidad creada ${createdCapability.id} declara ${JSON.stringify(arr(createdCapability.behaviorIds))}.`,
          rel(P.tasks),
          task.id,
        );
      }

      const taskSemanticKeys =
        new Set(
          arr(task.semanticKeys),
        );

      const capabilitySemanticKeys =
        new Set(
          arr(
            createdCapability.semanticKeys,
          ),
        );

      if (
        JSON.stringify(
          [...taskSemanticKeys].sort(),
        ) !==
        JSON.stringify(
          [...capabilitySemanticKeys].sort(),
        )
      ) {
        addError(
          'TASK_CAPABILITY_SEMANTIC_KEY_MISMATCH',
          `${task.id} declara semanticKeys ${JSON.stringify(arr(task.semanticKeys))}, pero su capacidad creada ${createdCapability.id} declara ${JSON.stringify(arr(createdCapability.semanticKeys))}.`,
          rel(P.tasks),
          task.id,
        );
      }
    }

    if (
      task.type === 'functional' &&
      arr(
        task.requirementCoverage,
      ).length === 0
    ) {
      addError(
        'FUNCTIONAL_TASK_COVERAGE_EMPTY',
        `${task.id} es functional pero no declara requirementCoverage.`,
        rel(P.tasks),
        task.id,
      );
    }

    for (
      const coverage of
      arr(task.requirementCoverage)
    ) {
      if (
        !obj(coverage)
      ) {
        continue;
      }

      if (
        typeof coverage.requirementId !==
          'string' ||
        coverage.requirementId.trim() === ''
      ) {
        addError(
          'COVERAGE_REQUIREMENT_ID_MISSING',
          `${task.id} tiene un requirementCoverage sin requirementId.`,
          rel(P.tasks),
          task.id,
        );
        continue;
      }

      if (
        !requirementIds.has(
          coverage.requirementId,
        )
      ) {
        addError(
          'COVERAGE_REQUIREMENT_UNKNOWN',
          `${task.id} referencia ${coverage.requirementId} en requirementCoverage, pero no existe.`,
          rel(P.tasks),
          task.id,
        );
      }

      for (
        const behaviorId of
        arr(coverage.behaviorIds)
      ) {
        if (
          !behaviorIds.has(behaviorId)
        ) {
          addError(
            'COVERAGE_BEHAVIOR_UNKNOWN',
            `${task.id} referencia ${behaviorId} en requirementCoverage, pero no existe.`,
            rel(P.tasks),
            task.id,
          );
        }
      }
    }
  }

  detectCycles(
    tasks,
    'dependencyIds',
    'tasks',
    P.tasks,
  );

  const allPlannedCapabilities =
    capabilities.filter(
      (c) =>
        c?.implementationKind === 'planned',
    );

  const coveredPlannedCapabilities =
    new Set();

  for (const task of tasks) {
    if (!obj(task)) continue;

    for (
      const capabilityId of
      arr(task.createsCapabilityIds)
    ) {
      coveredPlannedCapabilities.add(
        capabilityId,
      );
    }
  }

  for (
    const capability of
    allPlannedCapabilities
  ) {
    if (
      !coveredPlannedCapabilities.has(
        capability.id,
      )
    ) {
      addError(
        'PLANNED_CAPABILITY_NOT_COVERED',
        `${capability.id} es planned pero no es creada por ninguna tarea.`,
        rel(P.tasks),
        capability.id,
      );
    }
  }

  const taskCapabilityCoverage =
    new Map();

  for (const task of tasks) {
    if (!obj(task)) continue;

    for (
      const capabilityId of
      arr(task.createsCapabilityIds)
    ) {
      const count =
        taskCapabilityCoverage.get(
          capabilityId,
        ) ?? 0;

      taskCapabilityCoverage.set(
        capabilityId,
        count + 1,
      );
    }
  }

  for (
    const [capabilityId, count] of
    taskCapabilityCoverage.entries()
  ) {
    if (count > 1) {
      addError(
        'CAPABILITY_CREATED_MULTIPLE_TIMES',
        `${capabilityId} es creada por ${count} tareas.`,
        rel(P.tasks),
        capabilityId,
      );
    }
  }

  const epicCapabilityCoverage =
    new Map();

  for (const epic of epics) {
    if (!obj(epic)) continue;

    for (
      const capabilityId of
      arr(epic.capabilityIds)
    ) {
      const count =
        epicCapabilityCoverage.get(
          capabilityId,
        ) ?? 0;

      epicCapabilityCoverage.set(
        capabilityId,
        count + 1,
      );
    }
  }

  for (
    const [capabilityId, count] of
    epicCapabilityCoverage.entries()
  ) {
    if (count > 1) {
      addError(
        'CAPABILITY_ASSIGNED_MULTIPLE_EPICS',
        `${capabilityId} es asignada a ${count} épicas.`,
        rel(P.epics),
        capabilityId,
      );
    }
  }

  const allEpicCapabilities =
    new Set();

  for (const epic of epics) {
    if (!obj(epic)) continue;

    for (
      const capabilityId of
      arr(epic.capabilityIds)
    ) {
      allEpicCapabilities.add(capabilityId);
    }
  }

  for (
    const capability of
    allPlannedCapabilities
  ) {
    if (
      !allEpicCapabilities.has(
        capability.id,
      )
    ) {
      addError(
        'PLANNED_CAPABILITY_NOT_IN_EPIC',
        `${capability.id} es planned pero no aparece en ninguna épica.`,
        rel(P.epics),
        capability.id,
      );
    }
  }

  const allPlannedCapabilityIds =
    new Set(
      allPlannedCapabilities.map(
        (c) => c.id,
      ),
    );

  for (
    const capabilityId of
    allEpicCapabilities
  ) {
    if (
      !allPlannedCapabilityIds.has(
        capabilityId,
      )
    ) {
      addError(
        'NON_PLANNED_CAPABILITY_IN_EPIC',
        `${capabilityId} aparece en una épica pero no es planned.`,
        rel(P.epics),
        capabilityId,
      );
    }
  }

  const epicTaskCoverage =
    new Map();

  for (const task of tasks) {
    if (!obj(task)) continue;

    const count =
      epicTaskCoverage.get(task.epicId) ?? 0;

    epicTaskCoverage.set(
      task.epicId,
      count + 1,
    );
  }

  for (const epic of epics) {
    if (!obj(epic)) continue;

    const expectedCount =
      epicTaskCoverage.get(epic.id) ?? 0;

    const actualCount =
      arr(epic.taskIds).length;

    if (expectedCount !== actualCount) {
      addError(
        'EPIC_TASK_COUNT_MISMATCH',
        `${epic.id} declara ${actualCount} tareas, pero tiene ${expectedCount}.`,
        rel(P.epics),
        epic.id,
      );
    }
  }

  for (const epic of epics) {
    if (!obj(epic)) continue;

    for (
      const taskId of
      arr(epic.taskIds)
    ) {
      const task = taskMap.get(taskId);

      if (!task) {
        addError(
          'EPIC_TASK_UNKNOWN',
          `${epic.id} referencia ${taskId}, que no existe.`,
          rel(P.epics),
          epic.id,
        );
        continue;
      }

      if (task.epicId !== epic.id) {
        addError(
          'EPIC_TASK_BELONGS_ELSEWHERE',
          `${epic.id} reclama ${taskId}, pero la tarea pertenece a ${task.epicId}.`,
          rel(P.epics),
          epic.id,
        );
      }
    }
  }

  const taskDependencyAncestors =
    ancestorResolver(tasks);

  for (const task of tasks) {
    if (!obj(task)) continue;

    const ancestors =
      taskDependencyAncestors(task.id);

    if (ancestors.has(task.id)) {
      addError(
        'TASK_DEPENDENCY_CYCLE',
        `${task.id} tiene un ciclo en sus dependencias.`,
        rel(P.tasks),
        task.id,
      );
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    for (
      const dependencyId of
      arr(task.dependencyIds)
    ) {
      const dependency =
        taskMap.get(dependencyId);

      if (!dependency) continue;

      if (dependency.epicId !== task.epicId) {
        addWarning(
          'TASK_CROSS_EPIC_DEPENDENCY',
          `${task.id} depende de ${dependencyId}, que pertenece a otra épica.`,
          rel(P.tasks),
          task.id,
        );
      }
    }
  }

  const requiredCapabilityOwners =
    new Map();

  for (
    const capability of
    allPlannedCapabilities
  ) {
    for (
      const requiredId of
      arr(
        capability.requiredCapabilityIds,
      )
    ) {
      const owners =
        requiredCapabilityOwners.get(
          requiredId,
        ) ?? [];

      owners.push(capability.id);

      requiredCapabilityOwners.set(
        requiredId,
        owners,
      );
    }
  }

  for (
    const [requiredId, consumers] of
    requiredCapabilityOwners.entries()
  ) {
    const requiredCapability =
      capabilityMap.get(requiredId);

    if (!requiredCapability) continue;

    if (
      requiredCapability.implementationKind !==
        'preexisting' &&
      requiredCapability.implementationKind !==
        'external'
    ) {
      const creators =
        creatorsByCapability.get(
          requiredId,
        ) ?? [];

      if (creators.length === 0) {
        addError(
          'REQUIRED_CAPABILITY_NOT_CREATED',
          `${requiredId} es requerido por ${consumers.join(', ')}, pero no es creado por ninguna tarea.`,
          rel(P.tasks),
          requiredId,
        );
      }
    }
  }

  const taskDependencyGraph =
    new Map();

  for (const task of tasks) {
    if (!obj(task)) continue;

    taskDependencyGraph.set(
      task.id,
      arr(task.dependencyIds),
    );
  }

  for (
    const [taskId, dependencies] of
    taskDependencyGraph.entries()
  ) {
    for (
      const dependencyId of dependencies
    ) {
      if (
        !taskDependencyGraph.has(dependencyId)
      ) {
        addError(
          'TASK_DEPENDENCY_MISSING',
          `${taskId} depende de ${dependencyId}, que no existe.`,
          rel(P.tasks),
          taskId,
        );
      }
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    const expectedCapability =
      arr(
        task.createsCapabilityIds,
      ).length === 1
        ? capabilityMap.get(
            arr(
              task.createsCapabilityIds,
            )[0],
          )
        : null;

    if (
      task.type === 'functional' &&
      expectedCapability
    ) {
      const taskBehaviorIds =
        new Set(
          arr(task.behaviorIds),
        );

      const capabilityBehaviorIds =
        new Set(
          arr(
            expectedCapability.behaviorIds,
          ),
        );

      if (
        JSON.stringify(
          [...taskBehaviorIds].sort(),
        ) !==
        JSON.stringify(
          [...capabilityBehaviorIds].sort(),
        )
      ) {
        addError(
          'TASK_BEHAVIOR_MISMATCH_WITH_CAPABILITY',
          `${task.id} declara behaviors ${JSON.stringify(arr(task.behaviorIds))}, pero su capacidad ${expectedCapability.id} declara ${JSON.stringify(arr(expectedCapability.behaviorIds))}.`,
          rel(P.tasks),
          task.id,
        );
      }
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    for (
      const coverage of
      arr(task.requirementCoverage)
    ) {
      if (!obj(coverage)) continue;

      for (
        const behaviorId of
        arr(coverage.behaviorIds)
      ) {
        const behavior =
          behaviorMap.get(behaviorId);

        if (!behavior) continue;

        const actualRequirementId =
          behaviorRequirementIds.get(behaviorId);

        if (
          actualRequirementId !==
          coverage.requirementId
        ) {
          addError(
            'COVERAGE_BEHAVIOR_REQUIREMENT_MISMATCH',
            `${task.id} referencia ${behaviorId} en cobertura de ${coverage.requirementId}, pero el behavior pertenece a ${actualRequirementId}.`,
            rel(P.tasks),
            task.id,
          );
        }
      }
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    if (
      task.type === 'functional'
    ) {
      const createdCapability =
        arr(
          task.createsCapabilityIds,
        ).length === 1
          ? capabilityMap.get(
              arr(
                task.createsCapabilityIds,
              )[0],
            )
          : null;

      if (createdCapability) {
        const taskSemanticKeys =
          new Set(
            arr(task.semanticKeys),
          );

        const capabilitySemanticKeys =
          new Set(
            arr(
              createdCapability.semanticKeys,
            ),
          );

        if (
          JSON.stringify(
            [...taskSemanticKeys].sort(),
          ) !==
          JSON.stringify(
            [...capabilitySemanticKeys].sort(),
          )
        ) {
          addError(
            'TASK_SEMANTIC_KEYS_MISMATCH_WITH_CAPABILITY',
            `${task.id} declara semanticKeys ${JSON.stringify(arr(task.semanticKeys))}, pero su capacidad ${createdCapability.id} declara ${JSON.stringify(arr(createdCapability.semanticKeys))}.`,
            rel(P.tasks),
            task.id,
          );
        }
      }
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    if (
      task.type === 'functional'
    ) {
      const coverageBehaviorIds =
        new Set();

      for (
        const coverage of
        arr(task.requirementCoverage)
      ) {
        for (
          const behaviorId of
          arr(coverage.behaviorIds)
        ) {
          coverageBehaviorIds.add(behaviorId);
        }
      }

      const taskBehaviorIds =
        new Set(
          arr(task.behaviorIds),
        );

      if (
        JSON.stringify(
          [...coverageBehaviorIds].sort(),
        ) !==
        JSON.stringify(
          [...taskBehaviorIds].sort(),
        )
      ) {
        addError(
          'TASK_COVERAGE_BEHAVIOR_MISMATCH',
          `${task.id} tiene cobertura con behaviors ${JSON.stringify([...coverageBehaviorIds])}, pero declara ${JSON.stringify(arr(task.behaviorIds))}.`,
          rel(P.tasks),
          task.id,
        );
      }
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    if (
      task.type === 'functional' &&
      arr(task.behaviorIds).length > 0
    ) {
      const allCovered = arr(
        task.behaviorIds,
      ).every((behaviorId) =>
        arr(task.requirementCoverage).some(
          (coverage) =>
            obj(coverage) &&
            arr(
              coverage.behaviorIds,
            ).includes(behaviorId),
        ),
      );

      if (!allCovered) {
        addError(
          'TASK_BEHAVIOR_NOT_IN_COVERAGE',
          `${task.id} tiene behaviors que no aparecen en requirementCoverage.`,
          rel(P.tasks),
          task.id,
        );
      }
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    for (
      const coverage of
      arr(task.requirementCoverage)
    ) {
      if (!obj(coverage)) continue;

      if (
        typeof coverage.scopeItemIds !==
          'undefined' &&
        !Array.isArray(
          coverage.scopeItemIds,
        )
      ) {
        addError(
          'COVERAGE_SCOPE_ITEMS_INVALID',
          `${task.id} tiene scopeItemIds inválido en requirementCoverage.`,
          rel(P.tasks),
          task.id,
        );
      }

      if (
        typeof coverage.acceptanceCriterionIds !==
          'undefined' &&
        !Array.isArray(
          coverage.acceptanceCriterionIds,
        )
      ) {
        addError(
          'COVERAGE_ACCEPTANCE_CRITERIA_INVALID',
          `${task.id} tiene acceptanceCriterionIds inválido en requirementCoverage.`,
          rel(P.tasks),
          task.id,
        );
      }
    }
  }

  for (const task of tasks) {
    if (!obj(task)) continue;

    for (
      const coverage of
      arr(task.requirementCoverage)
    ) {
      if (!obj(coverage)) continue;

      if (
        typeof coverage.requirementId ===
          'string' &&
        coverage.requirementId.trim() !== ''
      ) {
        const requirement =
          requirementMap.get(
            coverage.requirementId,
          );

        if (requirement) {
          const requirementBehaviorIds =
            new Set(
              arr(
                requirement.behaviors,
              ).map((b) => b.id),
            );

          for (
            const behaviorId of
            arr(coverage.behaviorIds)
          ) {
            if (
              !requirementBehaviorIds.has(
                behaviorId,
              )
            ) {
              addError(
                'COVERAGE_BEHAVIOR_NOT_IN_REQUIREMENT',
                `${task.id} referencia ${behaviorId} en cobertura de ${coverage.requirementId}, pero el behavior no pertenece a ese requisito.`,
                rel(P.tasks),
                task.id,
              );
            }
          }
        }
      }
    }
  }

  const epicDependencyGraph =
    new Map();

  for (const epic of epics) {
    if (!obj(epic)) continue;

    epicDependencyGraph.set(
      epic.id,
      arr(epic.dependencyIds),
    );
  }

  for (
    const [epicId, dependencies] of
    epicDependencyGraph.entries()
  ) {
    for (
      const dependencyId of dependencies
    ) {
      if (
        !epicDependencyGraph.has(dependencyId)
      ) {
        addError(
          'EPIC_DEPENDENCY_MISSING',
          `${epicId} depende de ${dependencyId}, que no existe.`,
          rel(P.epics),
          epicId,
        );
      }
    }
  }

  for (const epic of epics) {
    if (!obj(epic)) continue;

    const expectedCapabilityCount =
      allPlannedCapabilities.filter(
        (c) => c.ownerEpicId === epic.id,
      ).length;

    const actualCapabilityCount =
      arr(epic.capabilityIds).length;

    if (
      expectedCapabilityCount !==
      actualCapabilityCount
    ) {
      addError(
        'EPIC_CAPABILITY_COUNT_MISMATCH',
        `${epic.id} declara ${actualCapabilityCount} capacidades, pero tiene ${expectedCapabilityCount}.`,
        rel(P.epics),
        epic.id,
      );
    }
  }

  for (const epic of epics) {
    if (!obj(epic)) continue;

    for (
      const capabilityId of
      arr(epic.capabilityIds)
    ) {
      const capability =
        capabilityMap.get(capabilityId);

      if (!capability) continue;

      if (
        capability.ownerEpicId !== epic.id
      ) {
        addError(
          'EPIC_CAPABILITY_OWNER_MISMATCH',
          `${epic.id} reclama ${capabilityId}, pero la capacidad declara ownerEpicId=${capability.ownerEpicId}.`,
          rel(P.epics),
          epic.id,
        );
      }
    }
  }

  const taskDependencyGraphForCycle =
    new Map();

  for (const task of tasks) {
    if (!obj(task)) continue;

    taskDependencyGraphForCycle.set(
      task.id,
      arr(task.dependencyIds),
    );
  }

  for (
    const [taskId, dependencies] of
    taskDependencyGraphForCycle.entries()
  ) {
    for (
      const dependencyId of dependencies
    ) {
      if (
        !taskDependencyGraphForCycle.has(
          dependencyId,
        )
      ) {
        addError(
          'TASK_DEPENDENCY_MISSING',
          `${taskId} depende de ${dependencyId}, que no existe.`,
          rel(P.tasks),
          taskId,
        );
      }
    }
  }


  const planPublished = state?.progress?.planPublished === true;
  const finalPlanApproved = state?.progress?.finalPlanApproved === true;
  const workflowStatus = state?.workflow?.status;
  const finalApproval = state?.approvals?.finalPlan;

  if (planPublished && !finalPlanApproved) {
    addError(
      'PUBLISHED_WITHOUT_APPROVAL',
      'planPublished=true sin finalPlanApproved=true.',
      rel(P.state),
      'progress.planPublished',
    );
  }

  if (finalPlanApproved) {
    if (finalApproval?.status !== 'approved') {
      addError(
        'FINAL_APPROVAL_RECORD_MISSING',
        'finalPlanApproved=true, pero approvals.finalPlan.status no es approved.',
        rel(P.state),
        'approvals.finalPlan',
      );
    }
    if (finalApproval?.resolvedBy !== 'user') {
      addError(
        'FINAL_APPROVAL_NOT_USER_RESOLVED',
        `approvals.finalPlan.resolvedBy=${JSON.stringify(finalApproval?.resolvedBy)}; debe ser user.`,
        rel(P.state),
        'approvals.finalPlan.resolvedBy',
      );
    }
    if (!isIsoTimestamp(finalApproval?.resolvedAt)) {
      addError(
        'FINAL_APPROVAL_TIMESTAMP_INVALID',
        'approvals.finalPlan.resolvedAt debe ser un timestamp ISO válido.',
        rel(P.state),
        'approvals.finalPlan.resolvedAt',
      );
    }
  }

  for (const [approvalKey, approval] of Object.entries(state?.approvals || {})) {
    if (approval?.requestedAt !== null && typeof approval?.requestedAt !== 'undefined' && !isIsoTimestamp(approval.requestedAt)) {
      addError('APPROVAL_REQUESTED_AT_INVALID', `approvals.${approvalKey}.requestedAt debe ser null o ISO válido.`, rel(P.state), `approvals.${approvalKey}.requestedAt`);
    }
    if (approval?.resolvedAt !== null && typeof approval?.resolvedAt !== 'undefined' && !isIsoTimestamp(approval.resolvedAt)) {
      addError('APPROVAL_RESOLVED_AT_INVALID', `approvals.${approvalKey}.resolvedAt debe ser null o ISO válido.`, rel(P.state), `approvals.${approvalKey}.resolvedAt`);
    }
    if (isIsoTimestamp(approval?.requestedAt) && isIsoTimestamp(approval?.resolvedAt) && Date.parse(approval.requestedAt) > Date.parse(approval.resolvedAt)) {
      addError('APPROVAL_TIMESTAMP_ORDER_INVALID', `approvals.${approvalKey}.requestedAt no puede ser posterior a resolvedAt.`, rel(P.state), `approvals.${approvalKey}`);
    }
    if (isIsoTimestamp(state?.timestamps?.createdAt)) {
      for (const field of ['requestedAt', 'resolvedAt']) {
        if (isIsoTimestamp(approval?.[field]) && Date.parse(approval[field]) < Date.parse(state.timestamps.createdAt)) {
          addError('APPROVAL_BEFORE_PROJECT_CREATION', `approvals.${approvalKey}.${field} es anterior a createdAt.`, rel(P.state), `approvals.${approvalKey}.${field}`);
        }
      }
    }
  }

  if (planPublished && tasksDocument?.status !== 'published') {
    addError(
      'TASK_PLAN_PUBLICATION_MISMATCH',
      'planPublished=true, pero task-plan.json no está published.',
      rel(P.state),
      'progress.planPublished',
    );
  }

  if (planPublished && epicsDocument?.status !== 'published') {
    addError(
      'EPIC_PLAN_PUBLICATION_MISMATCH',
      'planPublished=true, pero epic-plan.json no está published.',
      rel(P.state),
      'progress.planPublished',
    );
  }

  if (!planPublished && tasksDocument?.status === 'published') {
    addError(
      'TASK_PLAN_PUBLISHED_WITHOUT_STATE',
      'task-plan.json está published, pero progress.planPublished no es true.',
      rel(P.tasks),
    );
  }

  if (!planPublished && epicsDocument?.status === 'published') {
    addError(
      'EPIC_PLAN_PUBLISHED_WITHOUT_STATE',
      'epic-plan.json está published, pero progress.planPublished no es true.',
      rel(P.epics),
    );
  }

  if (workflowStatus === 'completed') {
    if (!planPublished || !finalPlanApproved) {
      addError(
        'COMPLETED_WITHOUT_PUBLISHED_APPROVED_PLAN',
        'workflow.status=completed exige planPublished=true y finalPlanApproved=true.',
        rel(P.state),
        'workflow.status',
      );
    }
    if (!isIsoTimestamp(state?.timestamps?.completedAt)) {
      addError(
        'COMPLETED_AT_MISSING',
        'workflow.status=completed exige timestamps.completedAt válido.',
        rel(P.state),
        'timestamps.completedAt',
      );
    }
  } else if (state?.timestamps?.completedAt !== null && typeof state?.timestamps?.completedAt !== 'undefined') {
    addError(
      'COMPLETED_AT_WITHOUT_COMPLETED_STATUS',
      'timestamps.completedAt está definido, pero workflow.status no es completed.',
      rel(P.state),
      'timestamps.completedAt',
    );
  }

  const artifactStatusPairs = [
    ['semanticContract', semanticDocument?.status],
    ['requirements', requirementsDocument?.status],
    ['capabilityMap', capabilitiesDocument?.status],
    ['epicPlan', epicsDocument?.status],
    ['taskPlan', tasksDocument?.status],
  ];

  for (const [artifactName, documentStatus] of artifactStatusPairs) {
    const artifactStatus = state?.artifacts?.[artifactName]?.status;
    if (typeof artifactStatus === 'string' && artifactStatus !== documentStatus) {
      addError(
        'ARTIFACT_STATUS_MISMATCH',
        `artifacts.${artifactName}.status=${JSON.stringify(artifactStatus)}, pero el documento declara ${JSON.stringify(documentStatus)}.`,
        rel(P.state),
        `artifacts.${artifactName}.status`,
      );
    }
  }

  const counts = {
    requirements: requirements.length,
    mvpRequirements: requirements.filter(
      (r) => r?.scope === 'mvp',
    ).length,
    coveredMvpRequirements: requirements.filter(
      (r) => {
        if (r?.scope !== 'mvp') {
          return false;
        }
        const requiredBehaviorIds = arr(r.behaviors)
          .filter((behavior) => behavior?.scope === 'mvp' && behavior?.confirmationStatus === 'confirmed')
          .map((behavior) => behavior.id);
        return requiredBehaviorIds.length > 0 && requiredBehaviorIds.every((id) => coveredMvpBehaviors.includes(id));
      },
    ).length,
    mvpFunctions:
      mvpBehaviors.length +
      unresolvedFunctions.filter(
        (f) => f.scope === 'mvp',
      ).length,
    unresolvedMvpFunctions:
      unresolvedFunctions.filter(
        (f) => f.scope === 'mvp',
      ).length,
    mvpBehaviors: mvpBehaviors.length,
    coveredMvpBehaviors:
      coveredMvpBehaviors.length,
    capabilities: capabilities.length,
    epics: epics.length,
    decomposedEpics: epics.filter(
      (e) => e?.decomposed === true,
    ).length,
    epicDependencies: epicGraph.relationCount,
    executionWaves: epicGraph.executionWaves.length,
    parallelEpicCandidates: epicGraph.parallelCandidateCount,
    tasks: tasks.length,
  };

  const statuses = {
    requirements:
      requirementsDocument?.status,
    capabilities:
      capabilitiesDocument?.status,
    epics: epicsDocument?.status,
    tasks: tasksDocument?.status,
  };

  compareCounter(
    state,
    'semanticContractsDetected',
    semanticContracts.length,
  );

  compareCounter(
    state,
    'mvpRequirementsDetected',
    counts.mvpRequirements,
  );

  compareCounter(
    state,
    'mvpFunctionsDetected',
    counts.mvpFunctions,
  );

  compareCounter(
    state,
    'mvpFunctionsAtomic',
    counts.mvpBehaviors,
  );

  compareCounter(
    state,
    'mvpFunctionsUnresolved',
    counts.unresolvedMvpFunctions,
  );

  compareCounter(
    state,
    'mvpBehaviorsDetected',
    counts.mvpBehaviors,
  );

  compareCounter(
    state,
    'mvpBehaviorsCovered',
    counts.coveredMvpBehaviors,
  );

  compareCounter(
    state,
    'capabilitiesMapped',
    counts.capabilities,
  );

  compareCounter(
    state,
    'epicsGenerated',
    counts.epics,
  );

  compareCounter(
    state,
    'epicsDecomposed',
    counts.decomposedEpics,
  );

  compareCounter(
    state,
    'tasksGenerated',
    counts.tasks,
  );

  compareCounter(
    state,
    'mvpRequirementsCovered',
    counts.coveredMvpRequirements,
  );

  const validationStatus = await writeOutputs({
    counts,
    statuses,
    state,
  });

  if (errors.length > 0) {
    console.error(
      `Plan inválido: ${errors.length} error(es) y ${warnings.length} advertencia(s).`,
    );
    console.error(
      `Consulta ${rel(P.report)} y ${rel(P.readiness)}.`,
    );
    process.exit(1);
  }

  console.log(
    `Plan válido con validator ${VALIDATOR_VERSION}: ${counts.mvpRequirements} requisitos MVP, ${counts.mvpBehaviors} behaviors MVP, ${counts.capabilities} capacidades, ${counts.epics} épicas y ${counts.tasks} tareas.`,
  );
  process.exit(validationStatus === 'passed' ? 0 : 1);
}

main().catch((error) => {
  console.error(
    `Error fatal: ${error.message}`,
  );

  process.exit(2);
});
