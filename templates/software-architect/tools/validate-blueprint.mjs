#!/usr/bin/env node

import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const VALIDATOR_NAME = 'validate-blueprint.mjs';
const VALIDATOR_VERSION = '1.0';

const APPROVAL_PHASES = new Set([2, 4, 7, 10]);

const PHASE_KEYS = [
  '1_discovery', '2_executive_definition', '3_users_and_processes',
  '4_module_catalog', '5_functional_requirements', '6_data_and_integrations',
  '7_architecture', '8_technology_stack', '9_security_and_nfr',
  '10_delivery_roadmap', '11_consistency_review', '12_final_document',
];

const DOC_KEY_TO_FILENAME = {
  '01_discovery': '01-discovery.md',
  '02_executive_definition': '02-executive-definition.md',
  '03_users_and_processes': '03-users-and-processes.md',
  '04_module_catalog': '04-module-catalog.md',
  '05_functional_requirements': '05-functional-requirements.md',
  '06_data_and_integrations': '06-data-and-integrations.md',
  '07_solution_architecture': '07-solution-architecture.md',
  '08_technology_stack': '08-technology-stack.md',
  '09_security_and_nfr': '09-security-and-nfr.md',
  '10_delivery_roadmap': '10-delivery-roadmap.md',
  '11_consistency_review': '11-consistency-review.md',
  '12_final_document': 'SOFTWARE-BLUEPRINT.md',
};

const DOCS_DIR = '.devflow/software-architect/docs';

function docFile(root, docKey) {
  const filename = DOC_KEY_TO_FILENAME[docKey];
  if (!filename) return null;
  return path.join(root, DOCS_DIR, filename);
}

const DOC_TEMPLATE_MAP = {
  '01-discovery.md': '01-discovery.md',
  '02-executive-definition.md': '02-executive-definition.md',
  '03-users-and-processes.md': '03-users-and-processes.md',
  '04-module-catalog.md': '04-module-catalog.md',
  '05-functional-requirements.md': '05-functional-requirements.md',
  '06-data-and-integrations.md': '06-data-and-integrations.md',
  '07-solution-architecture.md': '07-solution-architecture.md',
  '08-technology-stack.md': '08-technology-stack.md',
  '09-security-and-nfr.md': '09-security-and-nfr.md',
  '10-delivery-roadmap.md': '10-delivery-roadmap.md',
  '11-consistency-review.md': '11-consistency-review.md',
  'SOFTWARE-BLUEPRINT.md': 'SOFTWARE-BLUEPRINT.md',
};

const VALID_PHASE_STATUSES = new Set([
  'pending', 'in_progress', 'waiting_for_user', 'needs_revision', 'approved', 'blocked',
]);

const VALID_DOC_STATUSES = new Set([
  'pending', 'approved',
]);

const HERE = path.dirname(fileURLToPath(import.meta.url));

function resolveTemplatesDir(custom) {
  if (custom) return path.resolve(custom);
  const config = process.env.XDG_CONFIG_HOME
    ? path.join(process.env.XDG_CONFIG_HOME, 'opencode', 'templates', 'software-architect', 'doc-templates')
    : path.join(process.env.HOME || '~', '.config', 'opencode', 'templates', 'software-architect', 'doc-templates');
  return config;
}

const errors = [];
const warnings = [];

function addError(code, message, file = null, reference = null) {
  errors.push({ code, message, file, reference });
}

function addWarning(code, message, file = null, reference = null) {
  warnings.push({ code, message, file, reference });
}

function rel(filePath, root) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch { return false; }
}

async function readJson(filePath, label, root) {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) {
      addError('JSON_ROOT_INVALID', `${label} debe tener un objeto en la raíz.`, rel(filePath, root));
      return null;
    }
    return parsed;
  } catch (error) {
    addError('JSON_INVALID', `${label} no contiene JSON válido: ${error.message}`, rel(filePath, root));
    return null;
  }
}

async function readText(filePath, label, root) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    addError('FILE_UNREADABLE', `No se pudo leer ${label}: ${error.message}`, rel(filePath, root));
    return null;
  }
}

function markdownHeadings(text) {
  if (typeof text !== 'string') return [];
  const headings = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) headings.push(match[1].trim());
  }
  return headings;
}

function markdownIds(text, prefix) {
  if (typeof text !== 'string') return [];
  const ids = [];
  const pattern = new RegExp(`^${prefix}-[A-Z0-9][A-Z0-9_-]*`);
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(pattern);
    if (match) ids.push(match[0]);
  }
  return ids;
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    templates: null,
    json: false,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--root') {
      const val = argv[++i];
      if (!val) throw new Error('Falta valor para --root.');
      options.root = path.resolve(val);
    } else if (arg === '--templates') {
      const val = argv[++i];
      if (!val) throw new Error('Falta valor para --templates.');
      options.templates = path.resolve(val);
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Argumento desconocido: ${arg}`);
    }
  }
  return options;
}

function usage() {
  console.error(`Uso: node ${VALIDATOR_NAME} [--root RUTA] [--templates RUTA] [--json] [--quiet]`);
}

function formatIssue(issue) {
  const loc = [issue.file, issue.reference].filter(Boolean).join(' · ');
  if (loc) return `- **${issue.code}** — ${issue.message} _(${loc})_`;
  return `- **${issue.code}** — ${issue.message}`;
}

// --- Validation logic ---

function validateProjectState(state, statePath, root) {
  if (!state) return;

  if (state.schemaVersion !== 1) {
    addError('SCHEMA_VERSION_INVALID', `project-state.json schemaVersion debe ser 1, recibió ${JSON.stringify(state.schemaVersion)}.`, rel(statePath, root));
  }

  if (!isObject(state.project)) {
    addError('PROJECT_MISSING', 'Falta project en project-state.json.', rel(statePath, root));
    return;
  }

  if (typeof state.project.name !== 'string' || state.project.name === null) {
    addWarning('PROJECT_NAME_MISSING', 'project.name no está definido.', rel(statePath, root), 'project.name');
  }

  if (![null, 'in_progress', 'completed', 'blocked'].includes(state.project.status)) {
    addError('PROJECT_STATUS_INVALID', `project.status=${JSON.stringify(state.project.status)} no es válido.`, rel(statePath, root), 'project.status');
  }

  if (!isObject(state.phases)) {
    addError('PHASES_MISSING', 'Falta phases en project-state.json.', rel(statePath, root));
    return;
  }

  for (const key of PHASE_KEYS) {
    const status = state.phases[key];
    if (!VALID_PHASE_STATUSES.has(status)) {
      addError('PHASE_STATUS_INVALID', `phases.${key}=${JSON.stringify(status)} no es válido.`, rel(statePath, root), key);
    }
  }

  if (!isObject(state.documents)) {
    addError('DOCUMENTS_MISSING', 'Falta documents en project-state.json.', rel(statePath, root));
    return;
  }

  for (const [key, doc] of Object.entries(state.documents)) {
    if (!isObject(doc)) {
      addError('DOCUMENT_INVALID', `documents.${key} debe ser un objeto.`, rel(statePath, root), key);
      continue;
    }
    if (!VALID_DOC_STATUSES.has(doc.status)) {
      addError('DOCUMENT_STATUS_INVALID', `documents.${key}.status=${JSON.stringify(doc.status)} no es válido.`, rel(statePath, root), `${key}.status`);
    }
    if (doc.approvedAt !== null && typeof doc.approvedAt !== 'string') {
      addError('APPROVED_AT_INVALID', `documents.${key}.approvedAt debe ser null o string ISO.`, rel(statePath, root), `${key}.approvedAt`);
    }
  }
}

function validateDocExistence(state, root) {
  if (!isObject(state?.documents)) return;

  for (const key of Object.keys(state.documents)) {
    const filePath = docFile(root, key);
    if (!filePath) continue;

    fileExists(filePath).then((ok) => {
      if (!ok) {
        addError('DOCUMENT_MISSING', `Falta ${rel(filePath, root)}.`, rel(filePath, root), key);
      }
    });
  }
}

async function validateDocHeadings(state, root, templatesDir) {
  if (!isObject(state?.documents)) return;

  for (const [docKey, filename] of Object.entries(DOC_KEY_TO_FILENAME)) {
    const docPath = path.join(root, DOCS_DIR, filename);
    const templateFilename = DOC_TEMPLATE_MAP[filename];
    if (!templateFilename) continue;
    const templatePath = path.join(templatesDir, templateFilename);

    const docExists = await fileExists(docPath);
    if (!docExists) continue;

    const templateExists = await fileExists(templatePath);
    if (!templateExists) {
      addWarning('TEMPLATE_MISSING', `No se encuentra la plantilla ${templateFile}.`, rel(templatePath, root));
      continue;
    }

    const docText = await readText(docPath, docFile, root);
    const templateText = await readText(templatePath, templateFile, root);
    if (!docText || !templateText) continue;

    const docHeadings = markdownHeadings(docText);
    const templateHeadings = markdownHeadings(templateText);

    for (const heading of templateHeadings) {
      if (heading.startsWith('_') && heading.endsWith('_')) continue;
      if (!docHeadings.includes(heading)) {
        addError('SECTION_MISSING', `${docFile} no contiene la sección requerida "${heading}".`, docFile, heading);
      }
    }
  }
}

async function validatePhaseConsistency(state, root) {
  if (!isObject(state?.phases) || !isObject(state?.documents)) return;

  for (const [key, doc] of Object.entries(state.documents)) {
    if (!isObject(doc)) continue;

    const filePath = docFile(root, key);
    if (!filePath) continue;
    const relPath = rel(filePath, root);

    const phaseKey = key;

    const phaseStatus = state.phases[phaseKey];
    const docExists = await fileExists(filePath);

    if (phaseStatus === 'approved' && !docExists) {
      addError('PHASE_APPROVED_DOC_MISSING', `La fase ${phaseKey} está approved pero falta ${relPath}.`, relPath, phaseKey);
    }

    if (docExists && doc.status === 'pending' && phaseStatus === 'approved') {
      addWarning('DOC_STATUS_STALE', `${relPath} existe pero su estado sigue pending en documents.`, relPath, `${key}.status`);
    }
  }
}

async function validateApprovalGates(state) {
  if (!isObject(state?.phases)) return;

  const phase11Status = state.phases['11_consistency_review'];
  if (!phase11Status || phase11Status === 'pending') return;

  for (const phaseNum of APPROVAL_PHASES) {
    const key = PHASE_KEYS[phaseNum - 1];
    const status = state.phases[key];
    if (status === 'pending' || status === 'in_progress') {
      addError('APPROVAL_GATE_NOT_PASSED', `La fase ${key} requiere aprobación explícita y está ${status}.`, null, key);
    }
  }
}

async function validateADRs(state, root) {
  if (!Array.isArray(state?.approvedDecisions)) return;

  const decisionsDir = path.resolve(root, '.devflow/software-architect/decisions');
  const decisionsExist = await fileExists(decisionsDir);
  if (!decisionsExist) {
    if (state.approvedDecisions.length > 0) {
      addError('DECISIONS_DIR_MISSING', `Hay ${state.approvedDecisions.length} decisiones aprobadas pero no existe decisions/.`, '.devflow/software-architect/decisions/');
    }
    return;
  }

  let adrFiles = [];
  try {
    adrFiles = (await readdir(decisionsDir)).filter((f) => f.endsWith('.md'));
  } catch {
    if (state.approvedDecisions.length > 0) {
      addError('DECISIONS_DIR_UNREADABLE', 'No se pudo leer decisions/.', '.devflow/software-architect/decisions/');
    }
    return;
  }

  for (const decision of state.approvedDecisions) {
    if (typeof decision !== 'string') continue;
    const found = adrFiles.some((f) => f.toLowerCase().includes(decision.toLowerCase().replace(/[^a-z0-9]/gi, '_')));
    if (!found) {
      addWarning('ADR_MISSING', `Decisión "${decision}" no tiene un ADR correspondiente en decisions/.`, '.devflow/software-architect/decisions/', decision);
    }
  }
}

async function validateNoOrphanDocs(state, root) {
  if (!isObject(state?.documents)) return;

  const docsDir = path.resolve(root, DOCS_DIR);
  const docsExist = await fileExists(docsDir);
  if (!docsExist) return;

  const registeredPaths = new Set();
  for (const key of Object.keys(state.documents)) {
    const filePath = docFile(root, key);
    if (filePath) registeredPaths.add(filePath);
  }

  let actualFiles = [];
  try {
    actualFiles = (await readdir(docsDir)).filter((f) => f.endsWith('.md'));
  } catch { return; }

  for (const file of actualFiles) {
    const filePath = path.resolve(docsDir, file);
    if (!registeredPaths.has(filePath)) {
      addWarning('ORPHAN_DOC', `${file} existe en docs/ pero no está registrado en project-state.json.documents.`, `${DOCS_DIR}/${file}`);
    }
  }
}

async function validateUniqueReqIds(state, root) {
  if (!isObject(state?.documents)) return;

  const reqPath = docFile(root, '05_functional_requirements');
  if (!reqPath) return;

  const reqExists = await fileExists(reqPath);
  if (!reqExists) return;

  const text = await readText(reqPath, '05-functional-requirements.md', root);
  if (!text) return;

  const ids = markdownIds(text, 'REQ');
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      addError('REQUIREMENT_ID_DUPLICATED', `ID ${id} aparece más de una vez en 05-functional-requirements.md.`, rel(reqPath, root), id);
    }
    seen.add(id);
  }
}

// --- Main ---

function buildOutput() {
  const status = errors.length === 0 ? 'passed' : 'failed';
  return {
    validator: { name: VALIDATOR_NAME, version: VALIDATOR_VERSION },
    validatedAt: new Date().toISOString(),
    status,
    summary: { errors: errors.length, warnings: warnings.length },
    blockingIssues: errors,
    warnings,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { root } = options;
  const templatesDir = resolveTemplatesDir(options.templates);

  const bpDir = path.join(root, '.devflow/software-architect');
  const stateFile = path.join(bpDir, 'project-state.json');

  if (!(await fileExists(stateFile))) {
    addError('PROJECT_STATE_MISSING', 'No existe .devflow/software-architect/project-state.json.', rel(stateFile, root));
    const output = buildOutput();
    if (!options.quiet) console.log(JSON.stringify(output, null, 2));
    process.exit(output.status === 'passed' ? 0 : 1);
  }

  const state = await readJson(stateFile, 'project-state.json', root);

  validateProjectState(state, stateFile, root);
  validateDocExistence(state, root);
  await validateDocHeadings(state, root, templatesDir);
  await validatePhaseConsistency(state, root);
  await validateApprovalGates(state);
  await validateADRs(state, root);
  await validateNoOrphanDocs(state, root);
  await validateUniqueReqIds(state, root);

  const output = buildOutput();

  if (!options.quiet) {
    if (options.json) {
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log(`Estado: ${output.status}`);
      console.log(`Errores: ${output.summary.errors}, Advertencias: ${output.summary.warnings}`);
      if (errors.length > 0) {
        console.log('\nErrores bloqueantes:');
        for (const err of errors) console.log(formatIssue(err));
      }
      if (warnings.length > 0) {
        console.log('\nAdvertencias:');
        for (const warn of warnings) console.log(formatIssue(warn));
      }
    }
  }

  process.exit(output.status === 'passed' ? 0 : 1);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
