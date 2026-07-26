#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TOOL_VERSION = '1.0';
const ROOT = process.cwd();
const TP = path.join(ROOT, '.devflow', 'task-planner');

const P = {
  capabilities: path.join(TP, 'capability-map.json'),
  semantic: path.join(TP, 'semantic-contract.json'),
  requirements: path.join(TP, 'requirements.json'),
  draftDir: path.join(TP, 'drafts'),
};

const REQUIRED_HEADINGS = [
  'Objetivo',
  'Capacidades creadas',
  'Capacidades consumidas',
  'Alcance',
  'Fuera de alcance',
  'Criterios de aceptación',
  'Pruebas',
  'Contrato semántico',
];

const errors = [];
const errorsByTask = new Map();

const arr = (value) => (Array.isArray(value) ? value : []);
const obj = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function compareIds(a, b) {
  return String(a).localeCompare(String(b));
}

function sortedUniqueStrings(values) {
  return [
    ...new Set(
      arr(values).filter(
        (value) => typeof value === 'string' && value.trim() !== '',
      ),
    ),
  ].sort(compareIds);
}

function sameStringSet(left, right) {
  return (
    JSON.stringify(sortedUniqueStrings(left)) ===
    JSON.stringify(sortedUniqueStrings(right))
  );
}

function addError(code, message, taskId = null) {
  errors.push({ code, message, taskId });
  if (taskId) {
    if (!errorsByTask.has(taskId)) {
      errorsByTask.set(taskId, []);
    }
    errorsByTask.get(taskId).push({ code, message });
  }
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
    throw new Error(`Falta ${label}: ${filePath}`);
  }
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    if (!obj(parsed)) {
      throw new Error(`${label} debe tener un objeto en la raíz`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`${label} no contiene JSON válido: ${error.message}`);
  }
}

async function readText(filePath, label) {
  if (!(await exists(filePath))) {
    throw new Error(`Falta ${label}: ${filePath}`);
  }
  return readFile(filePath, 'utf8');
}

function normalizeComparableText(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

function markdownSections(markdown) {
  const sections = new Map();
  if (typeof markdown !== 'string') return sections;

  const lines = markdown.split(/\r?\n/);
  const headings = [];

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match) {
      headings.push({ index, level: match[1].length, title: match[2].trim() });
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
        body: lines.slice(heading.index + 1, end).join('\n'),
      });
    }
  }

  return sections;
}

function markdownSectionBody(markdown, title) {
  const section = markdownSections(markdown).get(normalizeComparableText(title));
  return section?.body ?? null;
}

function sectionLines(markdown, heading) {
  if (typeof markdown !== 'string') return [];

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

function definitionIdsInSection(markdown, heading, prefix) {
  const ids = [];
  const idPattern = new RegExp(
    '^(' + prefix + '-[A-Z0-9][A-Z0-9_-]*)' + '(?=\\s|[:|.)-]|$|\\*\\*|__|`)',
  );

  for (const originalLine of sectionLines(markdown, heading)) {
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

function parseSemanticBlock(markdown, taskId) {
  const body = markdownSectionBody(markdown, 'Contrato semántico');
  if (body === null) {
    addError(
      'TASK_SEMANTIC_BLOCK_MISSING',
      `${taskId} no contiene la sección ## Contrato semántico.`,
      taskId,
    );
    return null;
  }

  const match = body.match(/```json\s*([\s\S]*?)```/i);
  if (!match) {
    addError(
      'TASK_SEMANTIC_BLOCK_INVALID',
      `${taskId} no contiene un bloque JSON válido dentro de ## Contrato semántico.`,
      taskId,
    );
    return null;
  }

  try {
    const parsed = JSON.parse(match[1]);
    if (!obj(parsed)) {
      throw new Error('la raíz debe ser un objeto');
    }
    return {
      body,
      rawBlock: match[0],
      value: parsed,
    };
  } catch (error) {
    addError(
      'TASK_SEMANTIC_BLOCK_INVALID',
      `${taskId} tiene JSON inválido en ## Contrato semántico: ${error.message}.`,
      taskId,
    );
    return null;
  }
}

function usage() {
  process.stderr.write(
    `validate-epic-batch.mjs v${TOOL_VERSION}\n\n` +
      `Uso:\n` +
      `  node .devflow/task-planner/tools/validate-epic-batch.mjs --epic EPIC-ID\n\n` +
      `Valida una sola épica desde drafts/ antes de promoverla al plan global.\n` +
      `No modifica ningún archivo.\n`,
  );
}

function parseArgs(argv) {
  let epicId = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--epic') {
      epicId = argv[index + 1];
      if (!epicId) throw new Error('--epic requiere un valor');
      index += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    }
    throw new Error(`Argumento no reconocido: ${arg}`);
  }

  if (!epicId) {
    throw new Error('Debe especificar --epic EPIC-ID');
  }

  return epicId;
}

function indexById(records, label) {
  const map = new Map();
  for (const record of records) {
    if (!obj(record) || typeof record.id !== 'string' || record.id.trim() === '') {
      throw new Error(`${label} contiene un registro sin id válido`);
    }
    if (map.has(record.id)) {
      throw new Error(`${label} contiene id duplicado: ${record.id}`);
    }
    map.set(record.id, record);
  }
  return map;
}

function indexContracts(records) {
  const map = new Map();
  for (const contract of records) {
    if (
      !obj(contract) ||
      typeof contract.behaviorId !== 'string' ||
      contract.behaviorId.trim() === ''
    ) {
      throw new Error(
        'semantic-contract.json contiene un contrato sin behaviorId válido',
      );
    }
    if (map.has(contract.behaviorId)) {
      throw new Error(
        `semantic-contract.json contiene behaviorId duplicado: ${contract.behaviorId}`,
      );
    }
    map.set(contract.behaviorId, contract);
  }
  return map;
}

async function main() {
  let epicId;
  try {
    epicId = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    usage();
    process.exit(1);
  }

  const partialPath = path.join(P.draftDir, `${epicId}.task-plan.partial.json`);

  let taskPartial, capabilityMap, semanticContract, requirements;
  try {
    [taskPartial, capabilityMap, semanticContract, requirements] = await Promise.all([
      readJson(partialPath, `drafts/${epicId}.task-plan.partial.json`),
      readJson(P.capabilities, 'capability-map.json'),
      readJson(P.semantic, 'semantic-contract.json'),
      readJson(P.requirements, 'requirements.json'),
    ]);
  } catch (error) {
    process.stderr.write(`Error fatal: ${error.message}\n`);
    process.exit(1);
  }

  const partialTasks = arr(taskPartial.tasks);
  indexById(partialTasks, `drafts/${epicId}.task-plan.partial.json`);
  const capabilityIndex = indexById(arr(capabilityMap.capabilities), 'capability-map.json');
  const semanticContractMap = indexContracts(arr(semanticContract.contracts));
  const semanticContracts = arr(semanticContract.contracts);
  const requirementIndex = indexById(arr(requirements.requirements), 'requirements.json');

  const epic = partialTasks.filter((t) => t.epicId === epicId);
  for (const task of partialTasks.filter((t) => t.epicId !== epicId)) {
    addError(
      'EPIC_PARTIAL_FOREIGN_TASK',
      `drafts/${epicId}.task-plan.partial.json contiene ${task.id ?? 'una tarea'} con epicId=${JSON.stringify(task.epicId)}.`,
      typeof task.id === 'string' ? task.id : null,
    );
  }
  if (epic.length === 0) {
    addError(
      'EPIC_TASKS_MISSING',
      `No se encontraron tareas con epicId=${epicId} en drafts/${epicId}.task-plan.partial.json.`,
    );
  }

  for (const task of epic) {
    const taskId = task.id;

    const markdownPath = path.join(P.draftDir, `${taskId}.md`);
    let markdown;
    try {
      markdown = await readText(markdownPath, `${taskId} Markdown`);
    } catch {
      addError('TASK_FILE_MISSING', `Falta ${taskId}.md.`, taskId);
      continue;
    }

    const titleMatch = markdown.match(/^#\s+(TASK-[A-Z0-9_-]+)\s+[—-]\s+(.+?)\s*$/m);
    if (!titleMatch || titleMatch[1] !== taskId) {
      addError(
        'TASK_ID_NOT_IN_MARKDOWN',
        `${taskId} no aparece correctamente en el encabezado principal.`,
        taskId,
      );
    } else if (
      normalizeComparableText(titleMatch[2]) !==
      normalizeComparableText(task.title)
    ) {
      addError(
        'TASK_TITLE_MISMATCH',
        `${taskId} tiene title=${JSON.stringify(task.title)}, pero el Markdown declara ${JSON.stringify(titleMatch[2])}.`,
        taskId,
      );
    }

    for (const heading of REQUIRED_HEADINGS) {
      if (markdownSectionBody(markdown, heading) === null) {
        addError(
          'TASK_SECTION_MISSING',
          `${taskId} no contiene ## ${heading}.`,
          taskId,
        );
      }
    }

    const createdIds = definitionIdsInSection(
      markdown,
      '## Capacidades creadas',
      'CAP',
    );
    const consumedIds = definitionIdsInSection(
      markdown,
      '## Capacidades consumidas',
      'CAP',
    );
    if (!sameStringSet(createdIds, task.createsCapabilityIds)) {
      addError(
        'TASK_CREATED_CAPABILITIES_MARKDOWN_MISMATCH',
        `${taskId} declara createsCapabilityIds=${JSON.stringify(arr(task.createsCapabilityIds))}, pero el Markdown contiene ${JSON.stringify(createdIds)}.`,
        taskId,
      );
    }
    if (!sameStringSet(consumedIds, task.consumesCapabilityIds)) {
      addError(
        'TASK_CONSUMED_CAPABILITIES_MARKDOWN_MISMATCH',
        `${taskId} declara consumesCapabilityIds=${JSON.stringify(arr(task.consumesCapabilityIds))}, pero el Markdown contiene ${JSON.stringify(consumedIds)}.`,
        taskId,
      );
    }

    for (const capId of arr(task.createsCapabilityIds)) {
      const capability = capabilityIndex.get(capId);
      if (!capability) {
        addError(
          'TASK_CREATES_UNKNOWN_CAPABILITY',
          `${taskId} crea ${capId}, que no existe en capability-map.json.`,
          taskId,
        );
        continue;
      }
      if (!sameStringSet(task.behaviorIds, capability.behaviorIds)) {
        addError(
          'TASK_BEHAVIOR_IDS_MISMATCH',
          `${taskId}.behaviorIds=${JSON.stringify(arr(task.behaviorIds))}, pero ${capId}.behaviorIds=${JSON.stringify(arr(capability.behaviorIds))}.`,
          taskId,
        );
      }
      if (!sameStringSet(task.semanticKeys, capability.semanticKeys)) {
        addError(
          'TASK_SEMANTIC_KEYS_MISMATCH',
          `${taskId}.semanticKeys=${JSON.stringify(arr(task.semanticKeys))}, pero ${capId}.semanticKeys=${JSON.stringify(arr(capability.semanticKeys))}.`,
          taskId,
        );
      }
    }

    const coverageBehaviorIds = arr(task.requirementCoverage).flatMap((coverage) =>
      arr(coverage?.behaviorIds),
    );
    if (!sameStringSet(coverageBehaviorIds, task.behaviorIds)) {
      addError(
        'TASK_REQUIREMENT_COVERAGE_BEHAVIOR_MISMATCH',
        `${taskId} tiene requirementCoverage.behaviorIds=${JSON.stringify(sortedUniqueStrings(coverageBehaviorIds))}, pero task.behaviorIds=${JSON.stringify(arr(task.behaviorIds))}.`,
        taskId,
      );
    }

    const scopeIds = definitionIdsInSection(markdown, '## Alcance', 'SCOPE');
    const acceptanceIds = definitionIdsInSection(
      markdown,
      '## Criterios de aceptación',
      'AC',
    );

    if (scopeIds.length === 0) {
      addError(
        'TASK_SCOPE_MISSING',
        `${taskId} no contiene ningún SCOPE-* en ## Alcance.`,
        taskId,
      );
    }
    if (acceptanceIds.length === 0) {
      addError(
        'TASK_ACCEPTANCE_MISSING',
        `${taskId} no contiene ningún AC-* en ## Criterios de aceptación.`,
        taskId,
      );
    }

    if (task.type === 'functional') {

      for (const coverage of arr(task.requirementCoverage)) {
        if (!requirementIndex.has(coverage.requirementId)) {
          addError(
            'TASK_COVERAGE_UNKNOWN_REQUIREMENT',
            `${taskId} cubre ${coverage.requirementId}, que no existe en requirements.json.`,
            taskId,
          );
        }
      }

      const expectedScopeIds = arr(task.requirementCoverage).flatMap(
        (coverage) => arr(coverage?.scopeItemIds),
      );
      const expectedAcceptanceIds = arr(task.requirementCoverage).flatMap(
        (coverage) => arr(coverage?.acceptanceCriterionIds),
      );

      if (!sameStringSet(scopeIds, expectedScopeIds)) {
        addError(
          'TASK_SCOPE_MARKDOWN_MISMATCH',
          `${taskId} declara scopeItemIds=${JSON.stringify(expectedScopeIds)}, pero el Markdown contiene ${JSON.stringify(scopeIds)}.`,
          taskId,
        );
      }
      if (!sameStringSet(acceptanceIds, expectedAcceptanceIds)) {
        addError(
          'TASK_ACCEPTANCE_MARKDOWN_MISMATCH',
          `${taskId} declara acceptanceCriterionIds=${JSON.stringify(expectedAcceptanceIds)}, pero el Markdown contiene ${JSON.stringify(acceptanceIds)}.`,
          taskId,
        );
      }
    }

    const semanticBlock = parseSemanticBlock(markdown, taskId);
    if (semanticBlock) {
      const expectedSourceFunctionIds = arr(task.behaviorIds)
        .map((behaviorId) => semanticContractMap.get(behaviorId)?.sourceFunctionId)
        .filter(Boolean);
      const expectedBackendBindings = arr(task.behaviorIds)
        .map((behaviorId) => semanticContractMap.get(behaviorId)?.backendBinding)
        .filter(Boolean);
      const expectedSemanticFields = [
        'behaviorIds',
        'semanticKeys',
        'sourceFunctionIds',
        'backendBindings',
      ];

      if (
        semanticBlock.body.trim() !== semanticBlock.rawBlock.trim() ||
        !semanticBlock.rawBlock.startsWith('```json\n') ||
        JSON.stringify(Object.keys(semanticBlock.value)) !==
          JSON.stringify(expectedSemanticFields)
      ) {
        addError(
          'TASK_SEMANTIC_BLOCK_MARKDOWN_MISMATCH',
          `${taskId} no contiene el bloque markdown exacto exigido para ## Contrato semántico.`,
          taskId,
        );
      }

      const blockFields = [
        ['behaviorIds', task.behaviorIds],
        ['semanticKeys', task.semanticKeys],
        ['sourceFunctionIds', expectedSourceFunctionIds],
        ['backendBindings', expectedBackendBindings],
      ];

      for (const [field, expected] of blockFields) {
        if (
          !Array.isArray(semanticBlock.value[field]) ||
          !sameStringSet(semanticBlock.value[field], expected)
        ) {
          addError(
            'TASK_SEMANTIC_BLOCK_MISMATCH',
            `${taskId}.${field}=${JSON.stringify(semanticBlock.value[field])}, pero se exige ${JSON.stringify(sortedUniqueStrings(expected))}.`,
            taskId,
          );
        }
      }

      for (const binding of expectedBackendBindings) {
        if (!markdown.includes(binding)) {
          addError(
            'TASK_BACKEND_BINDING_MISSING',
            `${taskId} no contiene el backendBinding canónico ${JSON.stringify(binding)}.`,
            taskId,
          );
        }
      }

      const foreignBindings = semanticContracts
        .filter(
          (contract) => !arr(task.behaviorIds).includes(contract.behaviorId),
        )
        .map((contract) => contract.backendBinding)
        .filter(
          (binding) => typeof binding === 'string' && binding.trim() !== '',
        );

      for (const binding of foreignBindings) {
        if (markdown.includes(binding)) {
          addError(
            'TASK_FOREIGN_BACKEND_BINDING',
            `${taskId} contiene el backendBinding de otro behavior: ${JSON.stringify(binding)}.`,
            taskId,
          );
        }
      }
    }
  }

  if (errors.length === 0) {
    process.stdout.write(
      JSON.stringify(
        {
          status: 'passed',
          epicId,
          taskCount: epic.length,
          errorCount: 0,
          errorsByTask: {},
          errors: [],
        },
        null,
        2,
      ) + '\n',
    );
    process.exit(0);
  } else {
    const grouped = {};
    for (const [taskId, taskErrors] of errorsByTask.entries()) {
      grouped[taskId] = taskErrors;
    }

    process.stdout.write(
      JSON.stringify(
        {
          status: 'failed',
          epicId,
          taskCount: epic.length,
          errorCount: errors.length,
          errorsByTask: grouped,
          errors,
        },
        null,
        2,
      ) + '\n',
    );
    process.exit(1);
  }
}

main().catch((error) => {
  process.stderr.write(`Error fatal: ${error.message}\n`);
  process.exit(1);
});
