#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TOOL_VERSION = '1.0';

function nowIso() {
  const override = process.env.NODE_ENV === 'test'
    ? process.env.TIMESTAMP_TOOL_TEST_NOW
    : null;
  return override || new Date().toISOString();
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

import { createHash } from 'node:crypto';

function digest(document) {
  const clone = structuredClone(document);
  if (isObject(clone.timestamps)) delete clone.timestamps.contentHash;
  const body = JSON.stringify(canonical(clone));
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

async function touch(filePath, at) {
  const resolved = path.resolve(filePath);
  const raw = await readFile(resolved, 'utf8');
  const data = JSON.parse(raw);

  if (!isObject(data)) {
    throw new Error(`La raíz debe ser un objeto: ${filePath}`);
  }

  data.timestamps ??= {};
  if (!data.timestamps.createdAt) data.timestamps.createdAt = at;
  data.timestamps.updatedAt = at;
  data.timestamps.contentHash = digest(data);

  await writeFile(resolved, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return data.timestamps;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '-h' || command === '--help') {
    console.error(`Uso:
  node timestamp.mjs now                    → imprime fecha ISO actual
  node timestamp.mjs touch <archivo.json>   → actualiza createdAt/updatedAt/contentHash
  node timestamp.mjs touch <archivo.json> <fecha-iso>  → usa fecha explícita`);
    process.exit(command ? 0 : 2);
  }

  const at = nowIso();

  if (command === 'now') {
    console.log(at);
    process.exit(0);
  }

  if (command === 'touch') {
    if (args.length === 0) {
      console.error('touch requiere al menos un archivo JSON.');
      process.exit(2);
    }

    const explicitDate = args.length === 2 ? args[1] : null;
    const timestamp = explicitDate || at;

    for (const file of args) {
      if (file === args[args.length - 1] && explicitDate) break;
      if (file === explicitDate) continue;
      const result = await touch(file, timestamp);
      console.error(`${file}: createdAt=${result.createdAt} updatedAt=${result.updatedAt}`);
    }
    process.exit(0);
  }

  console.error(`Comando desconocido: ${command}`);
  process.exit(2);
}

main().catch((err) => {
  console.error(`timestamp.mjs failed: ${err.message}`);
  process.exit(1);
});
