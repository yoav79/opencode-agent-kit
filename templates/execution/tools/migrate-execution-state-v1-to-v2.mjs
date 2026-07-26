#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  EXECUTION_ENGINE_CONTRACT_VERSION,
  EXECUTION_ENGINE_NAME,
  EXECUTION_STATE_SCHEMA_VERSION,
  LEGACY_EXECUTION_ENGINE_CONTRACT_VERSION,
  LEGACY_EXECUTION_ENGINE_NAME,
  LEGACY_EXECUTION_STATE_SCHEMA_VERSION,
  migrateExecutionStateDocument,
} from '../../shared/tools/devflow-runtime-helpers.mjs';

const TOOL_NAME = 'migrate-execution-state-v1-to-v2.mjs';

function usage() {
  console.error(`Uso: node ${TOOL_NAME} <execution-state.json>`);
}

async function main() {
  const target = process.argv[2];
  if (!target || process.argv.length !== 3 || target === '-h' || target === '--help') {
    usage();
    process.exit(target ? 0 : 2);
  }

  const filePath = path.resolve(target);
  const raw = await readFile(filePath, 'utf8');
  const document = JSON.parse(raw);

  if (document?.schemaVersion === EXECUTION_STATE_SCHEMA_VERSION
    && document?.engine?.name === EXECUTION_ENGINE_NAME
    && document?.engine?.contractVersion === EXECUTION_ENGINE_CONTRACT_VERSION) {
    console.log(`execution-state.json ya usa schemaVersion ${EXECUTION_STATE_SCHEMA_VERSION}.`);
    return;
  }

  if (document?.schemaVersion !== LEGACY_EXECUTION_STATE_SCHEMA_VERSION
    || document?.engine?.name !== LEGACY_EXECUTION_ENGINE_NAME
    || document?.engine?.contractVersion !== LEGACY_EXECUTION_ENGINE_CONTRACT_VERSION) {
    throw new Error('Solo se admite migrar el contrato legacy schemaVersion 1 owned by next-task.');
  }

  const migrated = migrateExecutionStateDocument(document);
  const backupPath = `${filePath}.v1`;

  await copyFile(filePath, backupPath);
  await writeFile(filePath, `${JSON.stringify(migrated, null, 2)}\n`, 'utf8');

  console.log(`Backup creado: ${path.basename(backupPath)}`);
  console.log(`execution-state.json actualizado a schemaVersion ${EXECUTION_STATE_SCHEMA_VERSION}`);
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsMain = process.argv[1] && path.resolve(process.argv[1]) === thisFile;
if (invokedAsMain) {
  main().catch((error) => {
    console.error(`Error interno de ${TOOL_NAME}: ${error?.stack ?? error?.message ?? error}`);
    process.exit(1);
  });
}
