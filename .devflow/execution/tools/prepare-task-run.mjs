#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { NEXT_TASK_RUNTIME_FILES } from './execution-contract-helpers.mjs';
import { prepareTaskRun } from './execution-transition-engine.mjs';

const TOOL_NAME = 'prepare-task-run.mjs';

function usage() {
  console.error(`Uso: node ${TOOL_NAME} [--root RUTA] [--attempt N]`);
}

function parseArgs(argv) {
  const options = { root: process.cwd(), attempt: null };

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
      if (!value) throw new Error('Falta el valor de --attempt.');
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 1 || `${parsed}` !== value.trim()) {
        console.error('INVALID_ATTEMPT');
        process.exit(1);
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

const EXIT_CODES = {
  RUN_PREPARED: 0,
  IDEMPOTENT: 0,
  RECOVERED: 0,
  STALE_SELECTION: 1,
  RUN_CONFLICT: 1,
  LOCK_TIMEOUT: 1,
  LOCK_FAILED: 1,
  NEXT_TASK_RUNTIME_MISSING: 2,
};

async function assertNextTaskRuntime(root) {
  const missing = [];

  for (const relativePath of NEXT_TASK_RUNTIME_FILES) {
    try {
      await access(path.join(root, relativePath));
    } catch {
      missing.push(relativePath);
    }
  }

  if (missing.length === 0) return;

  const error = new Error(
    `Faltan artefactos obligatorios de next-task: ${missing.join(', ')}. Ejecuta /init-next-task antes de /prepare-task-run.`,
  );
  error.code = 'NEXT_TASK_RUNTIME_MISSING';
  throw error;
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

  await assertNextTaskRuntime(options.root);

  const result = await prepareTaskRun({
    root: options.root,
    attempt: options.attempt,
  });

  const exitCode = EXIT_CODES[result.classification] ?? 2;

  if (exitCode === 0) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error(result.classification);
  }

  process.exit(exitCode);
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsMain = process.argv[1] && path.resolve(process.argv[1]) === thisFile;
if (invokedAsMain) {
  main().catch((error) => {
    const code = error?.code;
    if (code && EXIT_CODES[code] !== undefined) {
      console.error(code === 'NEXT_TASK_RUNTIME_MISSING' ? error.message : code);
      process.exit(EXIT_CODES[code]);
    }
    console.error(`Error interno de ${TOOL_NAME}: ${error?.stack ?? error?.message ?? error}`);
    process.exit(2);
  });
}
