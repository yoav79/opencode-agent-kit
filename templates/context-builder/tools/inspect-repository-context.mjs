#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const TOOL_NAME = 'inspect-repository-context.mjs';
const MAX_FILE_BYTES = 16384;
const MAX_PREVIEW_CHARS = 1200;
const DEFAULT_MAX_FILES = 50;
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.sqlite', '.db']);
const SENSITIVE_PATTERNS = [
  /^.*\.pem$/i,
  /^.*\.key$/i,
  /^.*\.p12$/i,
  /^.*\.pfx$/i,
  /^id_rsa$/i,
  /^id_ed25519$/i,
  /^.*\.sqlite$/i,
  /^.*\.db$/i,
  /^.*\.dump$/i,
  /^.*\.backup$/i,
  /^credentials.*$/i,
  /^secrets.*$/i,
  /^\.env.*$/i,
];

function usage() {
  console.error(`Uso: node ${TOOL_NAME} [--root RUTA] [--include RUTA]... [--max-files N]`);
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    includes: ['.'],
    maxFiles: DEFAULT_MAX_FILES,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('Falta el valor de --root.');
      options.root = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === '--include') {
      const value = argv[index + 1];
      if (!value) throw new Error('Falta el valor de --include.');
      if (options.includes.length === 1 && options.includes[0] === '.') options.includes = [];
      options.includes.push(value);
      index += 1;
      continue;
    }
    if (arg === '--max-files') {
      const value = argv[index + 1];
      const parsed = Number.parseInt(value ?? '', 10);
      if (!Number.isInteger(parsed) || parsed < 1) throw new Error('max-files debe ser un entero positivo.');
      options.maxFiles = parsed;
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

function isWithinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isSensitive(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const base = path.posix.basename(normalized);
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(base) || pattern.test(normalized));
}

function redactPreview(text) {
  return text
    .split('\n')
    .map((line) => {
      if (!/(secret|token|password|passwd|api[_-]?key|private[_-]?key|client[_-]?secret|access[_-]?key)/i.test(line)) {
        return line;
      }
      const separator = line.includes('=') ? '=' : (line.includes(':') ? ':' : null);
      if (!separator) return '[REDACTED LINE]';
      const [left] = line.split(separator, 1);
      return `${left}${separator} [REDACTED]`;
    })
    .join('\n');
}

async function describeFile(root, absolutePath) {
  const relativePath = path.relative(root, absolutePath).replace(/\\/g, '/');
  const metadata = await stat(absolutePath);
  const raw = await readFile(absolutePath);
  const digest = `sha256:${createHash('sha256').update(raw).digest('hex')}`;
  const binary = BINARY_EXTENSIONS.has(path.extname(relativePath).toLowerCase()) || raw.includes(0);

  if (binary) {
    return {
      path: relativePath,
      sizeBytes: metadata.size,
      sha256: digest,
      binary: true,
      truncated: metadata.size > MAX_FILE_BYTES,
      redacted: false,
      preview: null,
    };
  }

  const previewSource = raw.subarray(0, MAX_FILE_BYTES).toString('utf8');
  const preview = redactPreview(previewSource).slice(0, MAX_PREVIEW_CHARS);
  return {
    path: relativePath,
    sizeBytes: metadata.size,
    sha256: digest,
    binary: false,
    truncated: metadata.size > MAX_FILE_BYTES || preview.length < previewSource.length,
    redacted: preview !== previewSource.slice(0, preview.length),
    preview,
  };
}

async function collectFiles(root, includePath, entries, excluded, maxFiles) {
  if (entries.length >= maxFiles) return;

  const absolutePath = path.resolve(root, includePath);
  if (!isWithinRoot(root, absolutePath)) {
    excluded.push({ path: includePath, reason: 'OUTSIDE_ROOT' });
    return;
  }

  const relativePath = path.relative(root, absolutePath).replace(/\\/g, '/') || '.';
  if (relativePath !== '.' && isSensitive(relativePath)) {
    excluded.push({ path: relativePath, reason: 'SENSITIVE_PATTERN' });
    return;
  }

  let metadata;
  try {
    metadata = await stat(absolutePath);
  } catch (error) {
    excluded.push({ path: relativePath, reason: error.code === 'ENOENT' ? 'MISSING' : 'UNREADABLE' });
    return;
  }

  if (metadata.isDirectory()) {
    const directoryEntries = await readdir(absolutePath, { withFileTypes: true });
    directoryEntries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of directoryEntries) {
      if (entries.length >= maxFiles) break;
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      await collectFiles(root, path.join(relativePath, entry.name), entries, excluded, maxFiles);
    }
    return;
  }

  entries.push(await describeFile(root, absolutePath));
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

  const files = [];
  const excluded = [];
  for (const includePath of options.includes) {
    await collectFiles(options.root, includePath, files, excluded, options.maxFiles);
    if (files.length >= options.maxFiles) break;
  }

  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    tool: TOOL_NAME,
    root: options.root,
    includes: options.includes,
    maxFiles: options.maxFiles,
    files,
    excluded,
  }, null, 2)}\n`);
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsMain = process.argv[1] && path.resolve(process.argv[1]) === thisFile;
if (invokedAsMain) {
  main().catch((error) => {
    console.error(`Error interno de ${TOOL_NAME}: ${error?.stack ?? error?.message ?? error}`);
    process.exit(1);
  });
}
