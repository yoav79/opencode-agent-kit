#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function nowIso() {
  const override = process.env.NODE_ENV === 'test'
    ? process.env.TIMESTAMP_TOOL_TEST_NOW
    : null;
  return override || new Date().toISOString();
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function touchExecutionState(filePath, at) {
  const resolved = path.resolve(filePath);
  const raw = await readFile(resolved, 'utf8');
  const data = JSON.parse(raw);

  if (!isObject(data)) {
    throw new Error(`La raíz debe ser un objeto: ${filePath}`);
  }

  const timestamps = isObject(data.timestamps) ? data.timestamps : {};
  data.timestamps = {
    createdAt: timestamps.createdAt || at,
    updatedAt: at,
  };

  await writeFile(resolved, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return data.timestamps;
}

async function main() {
  const [filePath, explicitDate] = process.argv.slice(2);

  if (!filePath || filePath === '-h' || filePath === '--help') {
    console.error(`Uso:
  node touch-execution-state.mjs <execution-state.json>
  node touch-execution-state.mjs <execution-state.json> <fecha-iso>`);
    process.exit(filePath ? 0 : 2);
  }

  const timestamp = explicitDate || nowIso();
  const result = await touchExecutionState(filePath, timestamp);
  console.error(`${filePath}: createdAt=${result.createdAt} updatedAt=${result.updatedAt}`);
}

main().catch((err) => {
  console.error(`touch-execution-state.mjs failed: ${err.message}`);
  process.exit(1);
});
