#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  computeExpected,
  SELECTOR_NAME,
} from './select-next-task.mjs';

import {
  FILES,
  ROOT_KEYS,
  SNAPSHOT_KEYS,
  REASON_KEYS,
  ISSUE_KEYS,
  CLASSIFICATIONS,
  sameKeys,
  isObject,
  loadJson,
} from './execution-contract-helpers.mjs';

const VALIDATOR_NAME = 'validate-next-task.mjs';
const VALIDATOR_VERSION = '1.0';

function usage() {
  console.error(`Uso: node ${VALIDATOR_NAME} [--root RUTA] [--json] [--quiet]`);
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    json: false,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('Falta el valor de --root.');
      options.root = path.resolve(value);
      index += 1;
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

function validateSelectionShape(selection, raw, reportErrors) {
  if (!selection) return;

  if (!sameKeys(selection, ROOT_KEYS)) {
    reportErrors.push('selection.json no conserva exactamente las claves raíz requeridas y su orden contractual.');
  }
  if (selection.schemaVersion !== 1) {
    reportErrors.push('selection.json.schemaVersion debe ser 1.');
  }
  if (!CLASSIFICATIONS.has(selection.classification) || selection.classification === 'NOT_EVALUATED') {
    reportErrors.push('selection.json.classification no es una clasificación ejecutable válida.');
  }
  if (!Array.isArray(selection.otherReadyTaskIds)) {
    reportErrors.push('selection.json.otherReadyTaskIds debe ser un arreglo.');
  }
  if (!Array.isArray(selection.issues)) {
    reportErrors.push('selection.json.issues debe ser un arreglo.');
  }

  if (selection.sourceSnapshot !== null && !sameKeys(selection.sourceSnapshot, SNAPSHOT_KEYS)) {
    reportErrors.push('selection.json.sourceSnapshot no conserva la estructura contractual.');
  }
  if (selection.selectionReason !== null && !sameKeys(selection.selectionReason, REASON_KEYS)) {
    reportErrors.push('selection.json.selectionReason no conserva la estructura contractual.');
  }
  if (Array.isArray(selection.issues)) {
    for (const [index, entry] of selection.issues.entries()) {
      if (!sameKeys(entry, ISSUE_KEYS)) {
        reportErrors.push(`selection.json.issues[${index}] no conserva la estructura contractual.`);
        continue;
      }
      if (typeof entry.code !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(entry.code)) {
        reportErrors.push(`selection.json.issues[${index}].code es inválido.`);
      }
      if (typeof entry.source !== 'string' || entry.source.trim() === '') {
        reportErrors.push(`selection.json.issues[${index}].source es inválido.`);
      }
      if (typeof entry.message !== 'string' || entry.message.trim() === '') {
        reportErrors.push(`selection.json.issues[${index}].message es inválido.`);
      }
      if (!(entry.reference === null || (typeof entry.reference === 'string' && entry.reference.trim() !== ''))) {
        reportErrors.push(`selection.json.issues[${index}].reference es inválido.`);
      }
    }
  }

  if (raw !== null) {
    const expectedFormatting = `${JSON.stringify(selection, null, 2)}\n`;
    if (raw !== expectedFormatting) {
      reportErrors.push('selection.json debe usar dos espacios, el orden contractual de claves y un único salto de línea final.');
    }
  }
}

function issueSignature(entry) {
  return `${entry.code}\u0000${entry.source}\u0000${entry.reference ?? ''}`;
}

function compareActualToExpected(actual, expected, reportErrors) {
  if (!actual) return;

  const actualWithoutIssues = { ...actual, issues: [] };
  const expectedWithoutIssues = { ...expected, issues: [] };
  if (JSON.stringify(actualWithoutIssues) !== JSON.stringify(expectedWithoutIssues)) {
    reportErrors.push('selection.json no coincide con la selección determinista esperada.');
  }

  const actualIssues = Array.isArray(actual.issues) ? actual.issues.map(issueSignature) : [];
  const expectedIssues = expected.issues.map(issueSignature);
  if (JSON.stringify(actualIssues) !== JSON.stringify(expectedIssues)) {
    reportErrors.push('Los códigos, fuentes o referencias de issues no coinciden con el resultado esperado.');
  }
}

function printHumanReport(report) {
  if (report.status === 'passed') {
    console.log('Next Task validation passed');
    console.log(`classification: ${report.classification}`);
    if (report.selectedTaskId) console.log(`selectedTaskId: ${report.selectedTaskId}`);
    return;
  }

  console.error('Next Task validation failed');
  for (const error of report.errors) console.error(`- ${error}`);
  console.error(`expectedClassification: ${report.expectedClassification}`);
  if (report.expectedSelectedTaskId) {
    console.error(`expectedSelectedTaskId: ${report.expectedSelectedTaskId}`);
  }
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

  const reportErrors = [];
  const { expected } = await computeExpected(options.root);
  const selectionLoaded = await loadJson(options.root, FILES.selection, [], { required: true });
  const actual = selectionLoaded.value;

  if (selectionLoaded.raw === null) {
    reportErrors.push(`No existe ${FILES.selection}.`);
  } else if (!actual) {
    reportErrors.push(`${FILES.selection} no contiene un objeto JSON válido.`);
  }

  validateSelectionShape(actual, selectionLoaded.raw, reportErrors);
  compareActualToExpected(actual, expected, reportErrors);

  const report = {
    schemaVersion: 1,
    validator: {
      name: VALIDATOR_NAME,
      version: VALIDATOR_VERSION,
    },
    status: reportErrors.length === 0 ? 'passed' : 'failed',
    classification: actual?.classification ?? null,
    selectedTaskId: actual?.selectedTaskId ?? null,
    expectedClassification: expected.classification,
    expectedSelectedTaskId: expected.selectedTaskId,
    errors: reportErrors,
  };

  if (!options.quiet) {
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printHumanReport(report);
  }

  process.exit(reportErrors.length === 0 ? 0 : 1);
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsMain = process.argv[1] && path.resolve(process.argv[1]) === thisFile;
if (invokedAsMain) {
  main().catch((error) => {
    console.error(`Error interno de ${VALIDATOR_NAME}: ${error.stack ?? error.message}`);
    process.exit(2);
  });
}
