#!/usr/bin/env node

import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const TP = path.join(ROOT, 'task-planning');

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
      version: 3,
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
      } else if (
        typeof contract.sourceItem === 'string' &&
        !normalizeComparableText(section.body).includes(normalizeComparableText(contract.sourceItem))
      ) {
        addError(
          'SEMANTIC_SOURCE_ITEM_NOT_FOUND',
          `${contract.behaviorId} referencia ${JSON.stringify(contract.sourceItem)}, que no aparece en ${JSON.stringify(contract.sourceSection)}.`,
          rel(P.semantic),
          contract.behaviorId,
        );
      }
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
          rel(P.requirements),
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

      for (const field of ['operation', 'outcome', 'sourceSection', 'sourceItem']) {
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

    tasksByEpic.set(
      task.epicId,
      epicTasks,
    );

    const coverage = arr(
      task.requirementCoverage,
    );

    const coveredRequirementIds =
      coverage
        .filter(obj)
        .map(
          (item) =>
            item.requirementId,
        )
        .filter(
          (id) =>
            typeof id === 'string',
        );

    for (
      const duplicate of
      duplicateValues(
        coveredRequirementIds,
      )
    ) {
      addError(
        'TASK_REQUIREMENT_COVERAGE_DUPLICATED',
        `${task.id} repite requirementCoverage para ${duplicate}.`,
        rel(P.tasks),
        task.id,
      );
    }

    for (
      const [index, item] of
      coverage.entries()
    ) {
      if (!obj(item)) {
        addError(
          'REQUIREMENT_COVERAGE_INVALID',
          `${task.id}.requirementCoverage[${index}] debe ser un objeto.`,
          rel(P.tasks),
          task.id,
        );

        continue;
      }

      if (
        !requirementIds.has(
          item.requirementId,
        )
      ) {
        addError(
          'TASK_REQUIREMENT_UNKNOWN',
          `${task.id} cubre ${JSON.stringify(item.requirementId)}, pero no existe.`,
          rel(P.tasks),
          task.id,
        );
      }

      if (arr(item.behaviorIds).length === 0) {
        addError(
          'TASK_BEHAVIOR_COVERAGE_EMPTY',
          `${task.id} no declara behaviorIds para ${item.requirementId}.`,
          rel(P.tasks),
          task.id,
        );
      }

      for (const behaviorId of arr(item.behaviorIds)) {
        if (!behaviorIds.has(behaviorId)) {
          addError('TASK_BEHAVIOR_UNKNOWN', `${task.id} cubre ${behaviorId}, pero no existe.`, rel(P.tasks), task.id);
        } else if (behaviorRequirementIds.get(behaviorId) !== item.requirementId) {
          addError('TASK_BEHAVIOR_REQUIREMENT_MISMATCH', `${task.id} declara ${behaviorId} bajo ${item.requirementId}, pero pertenece a ${behaviorRequirementIds.get(behaviorId)}.`, rel(P.tasks), task.id);
        }
      }

      if (
        arr(item.scopeItemIds).length === 0
      ) {
        addError(
          'TASK_REQUIREMENT_SCOPE_EMPTY',
          `${task.id} no declara scopeItemIds para ${item.requirementId}.`,
          rel(P.tasks),
          task.id,
        );
      }

      if (
        arr(
          item.acceptanceCriterionIds,
        ).length === 0
      ) {
        addError(
          'TASK_REQUIREMENT_ACCEPTANCE_EMPTY',
          `${task.id} no declara acceptanceCriterionIds para ${item.requirementId}.`,
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

    const declaredBehaviorIds = arr(task.behaviorIds);
    const declaredSemanticKeys = arr(task.semanticKeys);

    if (task.type === 'functional') {
      if (declaredBehaviorIds.length === 0) {
        addError(
          'FUNCTIONAL_TASK_BEHAVIORS_EMPTY',
          `${task.id} no declara behaviorIds.`,
          rel(P.tasks),
          task.id,
        );
      }

      const createdFunctionalCapabilities = arr(task.createsCapabilityIds)
        .map((id) => capabilityMap.get(id))
        .filter((capability) => capability?.type === 'functional');

      const expectedBehaviorIds = createdFunctionalCapabilities
        .flatMap((capability) => arr(capability.behaviorIds));
      const expectedSemanticKeys = createdFunctionalCapabilities
        .flatMap((capability) => arr(capability.semanticKeys));

      const coverageBehaviorIds = arr(task.requirementCoverage)
        .filter(obj)
        .flatMap((coverage) => arr(coverage.behaviorIds));

      const actualBehaviorSet = [...new Set(declaredBehaviorIds)].sort();
      const capabilityBehaviorSet = [...new Set(expectedBehaviorIds)].sort();
      const coverageBehaviorSet = [...new Set(coverageBehaviorIds)].sort();
      const actualSemanticSet = [...new Set(declaredSemanticKeys)].sort();
      const capabilitySemanticSet = [...new Set(expectedSemanticKeys)].sort();

      if (JSON.stringify(actualBehaviorSet) !== JSON.stringify(capabilityBehaviorSet)) {
        addError(
          'TASK_CAPABILITY_BEHAVIOR_MISMATCH',
          `${task.id} declara behaviorIds=[${actualBehaviorSet.join(', ')}], pero sus capacidades creadas implementan [${capabilityBehaviorSet.join(', ')}].`,
          rel(P.tasks),
          task.id,
        );
      }

      if (JSON.stringify(actualBehaviorSet) !== JSON.stringify(coverageBehaviorSet)) {
        addError(
          'TASK_COVERAGE_BEHAVIOR_MISMATCH',
          `${task.id} declara behaviorIds=[${actualBehaviorSet.join(', ')}], pero requirementCoverage reclama [${coverageBehaviorSet.join(', ')}].`,
          rel(P.tasks),
          task.id,
        );
      }

      if (JSON.stringify(actualSemanticSet) !== JSON.stringify(capabilitySemanticSet)) {
        addError(
          'TASK_SEMANTIC_KEYS_MISMATCH',
          `${task.id} declara semanticKeys=[${actualSemanticSet.join(', ')}], pero sus capacidades creadas exigen [${capabilitySemanticSet.join(', ')}].`,
          rel(P.tasks),
          task.id,
        );
      }

      for (const behaviorId of declaredBehaviorIds) {
        const contract = semanticContractMap.get(behaviorId);
        if (!contract) {
          continue;
        }
        if (!declaredSemanticKeys.includes(contract.semanticKey)) {
          addError(
            'TASK_SEMANTIC_CONTRACT_MISMATCH',
            `${task.id} declara ${behaviorId}, pero no incluye semanticKey=${contract.semanticKey}.`,
            rel(P.tasks),
            task.id,
          );
        }
      }
    } else if (declaredBehaviorIds.length > 0 || declaredSemanticKeys.length > 0) {
      addError(
        'NON_FUNCTIONAL_TASK_HAS_SEMANTICS',
        `${task.id} es ${task.type}, pero declara behaviorIds o semanticKeys funcionales.`,
        rel(P.tasks),
        task.id,
      );
    }
  }

  detectCycles(
    tasks,
    'dependencyIds',
    'tasks',
    P.tasks,
  );

  const ancestorsOf =
    ancestorResolver(tasks);

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    const createdHere =
      new Set(
        arr(
          task.createsCapabilityIds,
        ),
      );

    const ancestors =
      ancestorsOf(task.id);

    for (
      const capabilityId of
      arr(task.consumesCapabilityIds)
    ) {
      if (
        createdHere.has(capabilityId)
      ) {
        continue;
      }

      const capability =
        capabilityMap.get(
          capabilityId,
        );

      if (!capability) {
        continue;
      }

      if (
        [
          'preexisting',
          'external',
        ].includes(
          capability.implementationKind,
        )
      ) {
        continue;
      }

      if (
        typeof capability.ownerTaskId !== 'string' ||
        !ancestors.has(
          capability.ownerTaskId,
        )
      ) {
        addError(
          'CONSUMED_CAPABILITY_NOT_AVAILABLE',
          `${task.id} consume ${capabilityId}, pero su ownerTaskId=${JSON.stringify(capability.ownerTaskId)} no es una dependencia anterior.`,
          rel(P.tasks),
          task.id,
        );
      }
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

    if (creators.length === 0) {
      addError(
        'CAPABILITY_WITHOUT_OWNER_TASK',
        `${capability.id} no es creada por ninguna tarea.`,
        rel(P.tasks),
        capability.id,
      );
    } else if (creators.length > 1) {
      addError(
        'CAPABILITY_MULTIPLE_OWNER_TASKS',
        `${capability.id} es creada por varias tareas: ${creators.join(', ')}.`,
        rel(P.tasks),
        capability.id,
      );
    } else if (
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

  for (const epic of epics) {
    if (
      !obj(epic) ||
      typeof epic.id !== 'string'
    ) {
      continue;
    }

    const declared = [
      ...arr(epic.taskIds),
    ].sort();

    const actual = [
      ...(
        tasksByEpic.get(epic.id) ?? []
      ),
    ].sort();

    if (
      JSON.stringify(declared) !==
      JSON.stringify(actual)
    ) {
      addError(
        'EPIC_TASK_INDEX_MISMATCH',
        `${epic.id} declara [${declared.join(', ')}], pero sus tareas reales son [${actual.join(', ')}].`,
        rel(P.epics),
        epic.id,
      );
    }
  }

  const actualEpicFiles =
    await markdownFiles(P.epicDir);

  const actualTaskFiles =
    await markdownFiles(P.taskDir);

  validateIndexFiles({
    records: epics,
    actualFiles: actualEpicFiles,
    expectedDirectory:
      'task-planning/epics',
    label: 'epic-plan.json',
    filePath: P.epics,
  });

  validateIndexFiles({
    records: tasks,
    actualFiles: actualTaskFiles,
    expectedDirectory:
      'task-planning/tasks',
    label: 'task-plan.json',
    filePath: P.tasks,
  });

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    const normalized =
      normalizeRelative(task.file);

    if (!normalized) {
      continue;
    }

    const markdown =
      await readText(
        path.join(ROOT, normalized),
        task.id,
      );

    if (markdown === null) {
      continue;
    }

    markdownByTask.set(
      task.id,
      markdown,
    );

    if (!markdown.includes(task.id)) {
      addError(
        'TASK_ID_NOT_IN_MARKDOWN',
        `${task.id} no aparece en su Markdown.`,
        normalized,
        task.id,
      );
    }

    const requiredHeadings = [
      '## Objetivo',
      '## Alcance',
      '## Fuera de alcance',
      '## Criterios de aceptación',
      '## Pruebas',
      '## Contrato semántico',
    ];

    for (
      const heading of
      requiredHeadings
    ) {
      if (!markdown.includes(heading)) {
        addError(
          'TASK_SECTION_MISSING',
          `${task.id} no contiene ${heading}.`,
          normalized,
          task.id,
        );
      }
    }

    const semanticSection = sectionLines(markdown, '## Contrato semántico').join('\n');
    const semanticBlockMatch = semanticSection.match(/```json\s*([\s\S]*?)```/i);
    let semanticBlock = null;

    if (!semanticBlockMatch) {
      addError(
        'TASK_SEMANTIC_BLOCK_MISSING',
        `${task.id} no contiene un bloque JSON en ## Contrato semántico.`,
        normalized,
        task.id,
      );
    } else {
      try {
        semanticBlock = JSON.parse(semanticBlockMatch[1]);
      } catch (error) {
        addError(
          'TASK_SEMANTIC_BLOCK_INVALID',
          `${task.id} tiene JSON inválido en ## Contrato semántico: ${error.message}`,
          normalized,
          task.id,
        );
      }
    }

    if (semanticBlock && task.type === 'functional') {
      const blockBehaviorSet = [...new Set(arr(semanticBlock.behaviorIds))].sort();
      const taskBehaviorSet = [...new Set(arr(task.behaviorIds))].sort();
      const blockSemanticSet = [...new Set(arr(semanticBlock.semanticKeys))].sort();
      const taskSemanticSet = [...new Set(arr(task.semanticKeys))].sort();
      const expectedSourceFunctionIds = taskBehaviorSet
        .map((id) => semanticContractMap.get(id)?.sourceFunctionId)
        .filter(Boolean)
        .sort();
      const blockSourceFunctionIds = [...new Set(arr(semanticBlock.sourceFunctionIds))].sort();

      if (JSON.stringify(blockBehaviorSet) !== JSON.stringify(taskBehaviorSet)) {
        addError(
          'TASK_MARKDOWN_BEHAVIOR_MISMATCH',
          `${task.id} declara behaviors distintos entre task-plan.json y su bloque semántico.`,
          normalized,
          task.id,
        );
      }
      if (JSON.stringify(blockSemanticSet) !== JSON.stringify(taskSemanticSet)) {
        addError(
          'TASK_MARKDOWN_SEMANTIC_KEY_MISMATCH',
          `${task.id} declara semanticKeys distintos entre task-plan.json y su bloque semántico.`,
          normalized,
          task.id,
        );
      }
      if (JSON.stringify(blockSourceFunctionIds) !== JSON.stringify(expectedSourceFunctionIds)) {
        addError(
          'TASK_MARKDOWN_SOURCE_FUNCTION_MISMATCH',
          `${task.id} declara sourceFunctionIds distintos al contrato semántico.`,
          normalized,
          task.id,
        );
      }
    }

    const scopeList =
      definitionIdsInSection(markdown, '## Alcance', 'SCOPE');

    const acceptanceList =
      definitionIdsInSection(markdown, '## Criterios de aceptación', 'AC');

    for (
      const duplicate of
      duplicateValues(scopeList)
    ) {
      addError(
        'TASK_SCOPE_ID_DUPLICATED',
        `${task.id} repite ${duplicate}.`,
        normalized,
        task.id,
      );
    }

    for (
      const duplicate of
      duplicateValues(
        acceptanceList,
      )
    ) {
      addError(
        'TASK_ACCEPTANCE_ID_DUPLICATED',
        `${task.id} repite ${duplicate}.`,
        normalized,
        task.id,
      );
    }

    const scopeIds =
      new Set(scopeList);

    const acceptanceIds =
      new Set(acceptanceList);

    for (
      const coverage of
      arr(task.requirementCoverage)
    ) {
      if (!obj(coverage)) {
        continue;
      }

      for (
        const scopeId of
        arr(coverage.scopeItemIds)
      ) {
        if (!scopeIds.has(scopeId)) {
          addError(
            'TASK_SCOPE_REFERENCE_MISSING',
            `${task.id} declara ${scopeId}, pero no existe en el Markdown.`,
            normalized,
            task.id,
          );
        }
      }

      for (
        const acceptanceId of
        arr(
          coverage.acceptanceCriterionIds,
        )
      ) {
        if (
          !acceptanceIds.has(
            acceptanceId,
          )
        ) {
          addError(
            'TASK_ACCEPTANCE_REFERENCE_MISSING',
            `${task.id} declara ${acceptanceId}, pero no existe en el Markdown.`,
            normalized,
            task.id,
          );
        }
      }
    }

    for (
      const capabilityId of
      arr(task.createsCapabilityIds)
    ) {
      if (
        !markdown.includes(capabilityId)
      ) {
        addError(
          'TASK_CREATED_CAPABILITY_NOT_IN_MARKDOWN',
          `${task.id} crea ${capabilityId}, pero no lo menciona en el Markdown.`,
          normalized,
          task.id,
        );
      }
    }

    for (
      const capabilityId of
      arr(task.consumesCapabilityIds)
    ) {
      if (
        !markdown.includes(capabilityId)
      ) {
        addError(
          'TASK_CONSUMED_CAPABILITY_NOT_IN_MARKDOWN',
          `${task.id} consume ${capabilityId}, pero no lo menciona en el Markdown.`,
          normalized,
          task.id,
        );
      }
    }
  }

  const coveredMvpIds = new Set();
  const coveredMvpBehaviorIds = new Set();
  const coverageTasksByBehavior = new Map();

  for (const task of tasks) {
    if (
      !obj(task) ||
      typeof task.id !== 'string'
    ) {
      continue;
    }

    const markdown =
      markdownByTask.get(task.id);

    const scopeIds =
      new Set(
        definitionIdsInSection(markdown, '## Alcance', 'SCOPE'),
      );

    const acceptanceIds =
      new Set(
        definitionIdsInSection(markdown, '## Criterios de aceptación', 'AC'),
      );

    for (
      const coverage of
      arr(task.requirementCoverage)
    ) {
      if (!obj(coverage)) {
        continue;
      }

      const requirement =
        requirementMap.get(
          coverage.requirementId,
        );

      if (!requirement) {
        continue;
      }

      if (
        requirement.scope !== 'mvp'
      ) {
        addError(
          'NON_MVP_REQUIREMENT_COVERED',
          `${task.id} declara cobertura para ${requirement.id}, cuyo scope es ${requirement.scope}.`,
          rel(P.tasks),
          task.id,
        );

        continue;
      }

      const scopeItemIds =
        arr(coverage.scopeItemIds);

      const acceptanceCriterionIds =
        arr(
          coverage.acceptanceCriterionIds,
        );

      const validScope =
        scopeItemIds.length > 0 &&
        scopeItemIds.every(
          (id) => scopeIds.has(id),
        );

      const validAcceptance =
        acceptanceCriterionIds.length > 0 &&
        acceptanceCriterionIds.every(
          (id) =>
            acceptanceIds.has(id),
        );

      if (validScope && validAcceptance) {
        for (const behaviorId of arr(coverage.behaviorIds)) {
          const behavior = behaviorMap.get(behaviorId);
          if (
            behavior &&
            behaviorRequirementIds.get(behaviorId) === requirement.id &&
            behavior.scope === 'mvp' &&
            behavior.confirmationStatus === 'confirmed'
          ) {
            coveredMvpBehaviorIds.add(behaviorId);

            if (!coverageTasksByBehavior.has(behaviorId)) {
              coverageTasksByBehavior.set(
                behaviorId,
                new Set(),
              );
            }

            coverageTasksByBehavior
              .get(behaviorId)
              .add(task.id);
          }
        }
      }
    }
  }

  const mvpRequirements =
    requirements.filter(
      (requirement) =>
        requirement?.scope === 'mvp',
    );

  const mvpBehaviors = [...behaviorMap.values()].filter(
    (behavior) => behavior?.scope === 'mvp' && behavior?.confirmationStatus === 'confirmed',
  );

  for (
    const [behaviorId, taskSet] of
    coverageTasksByBehavior.entries()
  ) {
    if (taskSet.size > 1) {
      addError(
        'BEHAVIOR_COVERAGE_DUPLICATED',
        `${behaviorId} es reclamado por varias tareas: ${[...taskSet].sort().join(', ')}.`,
        rel(P.tasks),
        behaviorId,
      );
    }
  }

  for (const requirement of mvpRequirements) {
    const requirementMvpBehaviorIds = arr(
      requirement.behaviors,
    )
      .filter(
        (behavior) =>
          behavior?.scope === 'mvp' &&
          behavior?.confirmationStatus === 'confirmed',
      )
      .map((behavior) => behavior.id);

    if (
      requirementMvpBehaviorIds.length > 0 &&
      requirementMvpBehaviorIds.every(
        (id) => coveredMvpBehaviorIds.has(id),
      )
    ) {
      coveredMvpIds.add(requirement.id);
    }
  }

  for (const behavior of mvpBehaviors) {
    if (!coveredMvpBehaviorIds.has(behavior.id)) {
      addError(
        'MVP_BEHAVIOR_UNCOVERED',
        `${behavior.id} no tiene cobertura válida.`,
        rel(P.requirements),
        behavior.id,
      );
    }
  }

  for (
    const requirement of
    mvpRequirements
  ) {
    if (
      !coveredMvpIds.has(
        requirement.id,
      )
    ) {
      addError(
        'MVP_REQUIREMENT_UNCOVERED',
        `${requirement.id} no tiene cobertura válida.`,
        rel(P.requirements),
        requirement.id,
      );
    }
  }

  const counts = {
    requirements:
      requirements.length,

    mvpRequirements:
      mvpRequirements.length,

    coveredMvpRequirements:
      coveredMvpIds.size,

    mvpFunctions:
      mvpBehaviors.length + unresolvedFunctions.filter((item) => item.scope === 'mvp').length,

    unresolvedMvpFunctions:
      unresolvedFunctions.filter((item) => item.scope === 'mvp').length,

    mvpBehaviors:
      mvpBehaviors.length,

    coveredMvpBehaviors:
      coveredMvpBehaviorIds.size,

    capabilities:
      capabilities.length,

    epics:
      epics.length,

    decomposedEpics:
      epics.filter(
        (epic) =>
          epic?.decomposed === true,
      ).length,

    tasks:
      tasks.length,
  };

  if (state) {
    compareCounter(
      state,
      'mvpRequirementsDetected',
      counts.mvpRequirements,
    );

    compareCounter(
      state,
      'mvpRequirementsCovered',
      counts.coveredMvpRequirements,
    );

    compareCounter(state, 'mvpFunctionsDetected', counts.mvpFunctions);
    compareCounter(state, 'mvpFunctionsAtomic', counts.mvpBehaviors);
    compareCounter(state, 'mvpFunctionsUnresolved', counts.unresolvedMvpFunctions);
    compareCounter(state, 'mvpBehaviorsDetected', counts.mvpBehaviors);
    compareCounter(state, 'mvpBehaviorsCovered', counts.coveredMvpBehaviors);

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

    if (
      state?.progress?.planPublished === true &&
      state?.progress?.finalPlanApproved !== true
    ) {
      addError(
        'PUBLISHED_WITHOUT_APPROVAL',
        'planPublished=true sin finalPlanApproved=true.',
        rel(P.state),
      );
    }

    if (
      state?.progress?.planPublished === true &&
      tasksDocument?.status !==
        'published'
    ) {
      addError(
        'TASK_PLAN_PUBLICATION_MISMATCH',
        'planPublished=true, pero task-plan.json no está published.',
        rel(P.state),
      );
    }

    if (
      state?.progress?.planPublished === true &&
      epicsDocument?.status !==
        'published'
    ) {
      addError(
        'EPIC_PLAN_PUBLICATION_MISMATCH',
        'planPublished=true, pero epic-plan.json no está published.',
        rel(P.state),
      );
    }

    if (
      ![
        'plan_validation',
        'plan_approval',
      ].includes(
        state?.workflow?.phase,
      )
    ) {
      addWarning(
        'VALIDATOR_EXECUTED_OUTSIDE_EXPECTED_PHASE',
        `El validador se ejecutó en ${JSON.stringify(state?.workflow?.phase)}.`,
        rel(P.state),
      );
    }
  }

  const status =
    await writeOutputs({
      counts,
      statuses: {
        requirements:
          requirementsDocument?.status,

        capabilities:
          capabilitiesDocument?.status,

        epics:
          epicsDocument?.status,

        tasks:
          tasksDocument?.status,
      },
      state,
    });

  if (status === 'passed') {
    console.log(
      `Plan válido: ${counts.mvpRequirements} requisitos MVP, ${counts.mvpBehaviors} behaviors MVP, ${counts.capabilities} capacidades, ${counts.epics} épicas y ${counts.tasks} tareas.`,
    );

    process.exitCode = 0;
  } else {
    console.error(
      `Plan inválido: ${errors.length} error(es) y ${warnings.length} advertencia(s).`,
    );

    console.error(
      `Consulta ${rel(P.report)} y ${rel(P.readiness)}.`,
    );

    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  addError(
    'VALIDATOR_INTERNAL_ERROR',
    error.stack ?? error.message,
  );

  try {
    await writeOutputs({
      counts: {
        requirements: 0,
        mvpRequirements: 0,
        coveredMvpRequirements: 0,
        mvpFunctions: 0,
        unresolvedMvpFunctions: 0,
        mvpBehaviors: 0,
        coveredMvpBehaviors: 0,
        capabilities: 0,
        epics: 0,
        decomposedEpics: 0,
        tasks: 0,
      },
      statuses: {},
      state: null,
    });
  } catch {
    // No ocultar el error original.
  }

  console.error(error);
  process.exitCode = 1;
});
