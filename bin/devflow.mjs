#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, renameSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative, normalize, isAbsolute, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI_ROOT = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CLI_ROOT, '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');
const LOCKFILE_PATH = '.devflow/devflow-lock.json';

const EXIT_OK = 0;
const EXIT_CONFLICT = 1;
const EXIT_ERROR = 2;

function hash(content) {
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}

function readJSON(path) {
  const text = readFileSync(path, 'utf-8');
  return { text, data: JSON.parse(text) };
}

function isAbsolutePath(p) {
  return isAbsolute(p) || p.startsWith('/');
}

function hasTraversal(p) {
  const parts = posix.normalize(p).split('/');
  return parts.includes('..');
}

function assertValidTarget(target) {
  if (isAbsolutePath(target)) throw new Error(`Target must be relative: ${target}`);
  if (hasTraversal(target)) throw new Error(`Target must not contain traversal: ${target}`);
  if (target.startsWith('..')) throw new Error(`Target must be within project: ${target}`);
}

function assertValidSource(source, root) {
  const full = join(root, source);
  if (!existsSync(full)) throw new Error(`Source not found: ${source}`);
  const resolved = resolve(full);
  if (!resolved.startsWith(resolve(root))) throw new Error(`Source outside repo root: ${source}`);
}

function loadManifest(name) {
  const path = join(PACKAGES_DIR, name, 'manifest.json');
  if (!existsSync(path)) return null;
  return readJSON(path).data;
}

function resolvePackage(name, visited = new Set(), stack = new Set(), order = []) {
  if (stack.has(name)) throw new Error(`Dependency cycle detected: ${name}`);
  if (visited.has(name)) return { manifest: loadManifest(name), order };
  visited.add(name);
  stack.add(name);

  const manifest = loadManifest(name);
  if (!manifest) throw new Error(`Unknown package: ${name}`);

  const deps = manifest.packages || manifest.dependencies || [];
  for (const dep of deps) {
    resolvePackage(dep, visited, stack, order);
  }

  stack.delete(name);
  if (!order.includes(name)) order.push(name);
  return { manifest, order };
}

function getAllFiles(manifest) {
  const result = [];
  if (manifest.files) result.push(...manifest.files);
  if (manifest.packages) {
    for (const pkg of manifest.packages) {
      const sub = loadManifest(pkg);
      if (sub) result.push(...getAllFiles(sub));
    }
  }
  if (manifest.dependencies) {
    for (const dep of manifest.dependencies) {
      const sub = loadManifest(dep);
      if (sub && !manifest.packages?.includes(dep)) result.push(...getAllFiles(sub));
    }
  }
  return result;
}

function deduplicate(arr) {
  return [...new Set(arr)];
}

function loadLockfile(projectRoot) {
  const path = join(projectRoot, LOCKFILE_PATH);
  if (!existsSync(path)) return null;
  try {
    return readJSON(path).data;
  } catch {
    return null;
  }
}

function writeLockfileAtomically(projectRoot, lock) {
  const dir = join(projectRoot, '.devflow');
  mkdirSync(dir, { recursive: true });
  const content = JSON.stringify(lock, null, 2) + '\n';
  const tmpPath = join(projectRoot, '.devflow', `devflow-lock.json.tmp`);
  writeFileSync(tmpPath, content, 'utf-8');
  const finalPath = join(projectRoot, LOCKFILE_PATH);
  renameSync(tmpPath, finalPath);
}

function buildLockEntry(packageName, installedFiles) {
  const entry = { version: '1.0.0', files: {} };
  for (const [target, info] of Object.entries(installedFiles)) {
    entry.files[target] = { kind: info.kind, contentHash: info.hash };
  }
  return entry;
}

export function cmdInit(args) {
  if (args.length === 0 || args[0] === '--help') {
    printUsage();
    return EXIT_OK;
  }

  const requestedPackage = args[0];
  const projectRoot = process.cwd();

  let resolved;
  try {
    resolved = resolvePackage(requestedPackage, new Set(), new Set(), []);
  } catch (err) {
    writeResult({ operation: 'init', requestedPackage, status: err.message.includes('cycle') ? 'DEPENDENCY_CYCLE' : err.message.includes('Unknown') ? 'INVALID_PACKAGE' : 'INSTALLATION_FAILED', error: err.message });
    return EXIT_ERROR;
  }

  const { manifest: rootManifest, order: resolvedOrder } = resolved;
  const packagesToInstall = rootManifest.packages
    ? [...rootManifest.packages]
    : [requestedPackage];

  // Validate all manifests first
  const allPackageNames = new Set();
  if (rootManifest.packages) {
    for (const p of rootManifest.packages) allPackageNames.add(p);
    for (const pkg of resolvedOrder) {
      const m = loadManifest(pkg);
      if (m) {
        if (m.dependencies) for (const d of m.dependencies) allPackageNames.add(d);
      }
    }
  } else {
    allPackageNames.add(requestedPackage);
    for (const pkg of resolvedOrder) {
      const m = loadManifest(pkg);
      if (m && m.dependencies) for (const d of m.dependencies) allPackageNames.add(d);
    }
  }

  // Validate ownership conflicts
  const targetOwners = {};
  for (const pkgName of [...allPackageNames, ...resolvedOrder]) {
    const m = loadManifest(pkgName);
    if (!m) continue;
    for (const f of m.files || []) {
      const existing = targetOwners[f.target];
      if (existing && existing !== pkgName) {
        const msg = `Ownership conflict: "${f.target}" claimed by "${existing}" and "${pkgName}"`;
        writeResult({ operation: 'init', requestedPackage, status: 'CONFLICT', error: msg });
        return EXIT_CONFLICT;
      }
      targetOwners[f.target] = pkgName;
    }
  }

  const result = {
    schemaVersion: 1,
    operation: 'init',
    requestedPackage,
    resolvedPackages: resolvedOrder,
    status: 'INSTALLED',
    createdDirectories: [],
    installedFiles: [],
    preservedFiles: [],
    conflicts: [],
    warnings: [],
  };

  const allInstalledFiles = {};
  let hasErrors = false;

  try {
    // Process in topological order
    for (const pkgName of resolvedOrder) {
      const m = loadManifest(pkgName);
      if (!m) continue;

      // Create directories
      for (const dir of m.directories || []) {
        assertValidTarget(dir);
        const fullPath = join(projectRoot, dir);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
          result.createdDirectories.push(dir);
        }
      }

      // Install files
      for (const f of m.files || []) {
        assertValidTarget(f.target);
        assertValidSource(f.source, REPO_ROOT);
        const sourcePath = join(REPO_ROOT, f.source);
        const targetPath = join(projectRoot, f.target);

        // Ensure parent directory
        mkdirSync(dirname(targetPath), { recursive: true });

        const sourceContent = readFileSync(sourcePath);
        const sourceHash = hash(sourceContent.toString());

        if (!existsSync(targetPath)) {
          if (f.kind === 'managed' || f.kind === 'seed') {
            copyFileSync(sourcePath, targetPath);
            result.installedFiles.push(f.target);
            allInstalledFiles[f.target] = { kind: f.kind, hash: sourceHash };
          } else if (f.kind === 'mutable') {
            copyFileSync(sourcePath, targetPath);
            result.installedFiles.push(f.target);
            allInstalledFiles[f.target] = { kind: f.kind, hash: sourceHash };
          }
        } else {
          const existingContent = readFileSync(targetPath);
          const existingHash = hash(existingContent.toString());

          if (f.kind === 'mutable') {
            result.preservedFiles.push(f.target);
            allInstalledFiles[f.target] = { kind: f.kind, hash: existingHash };
          } else if (existingHash === sourceHash) {
            result.preservedFiles.push(f.target);
            allInstalledFiles[f.target] = { kind: f.kind, hash: existingHash };
          } else {
            result.conflicts.push({
              package: pkgName,
              path: f.target,
              classification: 'MANAGED_FILE_MODIFIED',
              expectedHash: sourceHash,
              actualHash: existingHash,
            });
            hasErrors = true;
          }
        }
      }
    }

    // Write lockfile
    const lock = {
      schemaVersion: 1,
      installerVersion: '1.0.0',
      packages: {},
    };

    // Merge all installed files per package
    const filesByPackage = {};
    for (const pkgName of resolvedOrder) {
      const m = loadManifest(pkgName);
      if (!m) continue;
      for (const f of m.files || []) {
        if (allInstalledFiles[f.target]) {
          if (!filesByPackage[pkgName]) filesByPackage[pkgName] = {};
          filesByPackage[pkgName][f.target] = allInstalledFiles[f.target];
        }
      }
    }

    // Also include existing lockfile entries for packages not being reinstalled
    const existingLock = loadLockfile(projectRoot);
    if (existingLock) {
      for (const [pkgName, pkgData] of Object.entries(existingLock.packages || {})) {
        if (!resolvedOrder.includes(pkgName)) {
          lock.packages[pkgName] = pkgData;
        }
      }
    }

    for (const [pkgName, pkgFiles] of Object.entries(filesByPackage)) {
      lock.packages[pkgName] = buildLockEntry(pkgName, pkgFiles);
    }

    if (!hasErrors) {
      writeLockfileAtomically(projectRoot, lock);
    }

    if (hasErrors) {
      result.status = 'CONFLICT';
      writeResult(result);
      return EXIT_CONFLICT;
    }

    if (result.installedFiles.length === 0 && result.conflicts.length === 0) {
      result.status = 'ALREADY_INSTALLED';
    } else if (result.warnings.length > 0) {
      result.status = 'INSTALLED_WITH_WARNINGS';
    }

    writeResult(result);
    return EXIT_OK;

  } catch (err) {
    result.status = 'INSTALLATION_FAILED';
    result.error = err.message;
    writeResult(result);
    return EXIT_ERROR;
  }
}

export function cmdAudit() {
  const projectRoot = process.cwd();
  const result = {
    schemaVersion: 1,
    operation: 'audit',
    status: 'PASSED',
    packages: [],
    issues: [],
  };

  const lock = loadLockfile(projectRoot);
  if (!lock) {
    result.status = 'FAILED';
    result.issues.push({ type: 'LOCKFILE_INVALID', detail: 'Lockfile not found or invalid' });
    writeResult(result);
    return EXIT_CONFLICT;
  }

  const packagesDir = join(projectRoot, '.devflow');

  for (const [pkgName, pkgData] of Object.entries(lock.packages || {})) {
    const manifest = loadManifest(pkgName);
    const entry = {
      name: pkgName,
      version: pkgData.version,
      status: 'INSTALLED',
      files: [],
      issues: [],
    };

    const manifestFiles = manifest ? manifest.files || [] : [];

    for (const [targetPath, fileInfo] of Object.entries(pkgData.files || {})) {
      const fullPath = join(projectRoot, targetPath);
      const fileEntry = { path: targetPath, kind: fileInfo.kind };

      if (!existsSync(fullPath)) {
        entry.issues.push({ type: 'MANAGED_FILE_MISSING', path: targetPath });
        fileEntry.status = 'MISSING';
      } else if (fileInfo.kind === 'managed') {
        const content = readFileSync(fullPath);
        const currentHash = hash(content.toString());
        if (currentHash !== fileInfo.contentHash) {
          entry.issues.push({ type: 'MANAGED_FILE_MODIFIED', path: targetPath });
          fileEntry.status = 'MODIFIED';
        } else {
          fileEntry.status = 'OK';
        }
      } else {
        fileEntry.status = 'OK';
      }
      entry.files.push(fileEntry);
    }

    // Check for missing dependency installations
    if (manifest && manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        if (!lock.packages[dep]) {
          entry.issues.push({ type: 'DEPENDENCY_NOT_INSTALLED', detail: `Dependency "${dep}" not installed` });
        }
      }
    }

    if (entry.issues.length > 0) {
      entry.status = 'HAS_ISSUES';
    }

    result.packages.push(entry);
  }

  // Check for orphan files (files in .devflow not owned by any package)
  const ownedPaths = new Set();
  for (const pkgData of Object.values(lock.packages || {})) {
    for (const targetPath of Object.keys(pkgData.files || {})) {
      ownedPaths.add(targetPath);
    }
  }

  if (existsSync(packagesDir)) {
    checkOrphanFiles(packagesDir, '.devflow', ownedPaths, result);
  }

  // Check for missing manifests for installed packages
  for (const pkgName of Object.keys(lock.packages || {})) {
    if (!loadManifest(pkgName)) {
      result.issues.push({ type: 'MANIFEST_INVALID', detail: `Manifest not found for installed package: ${pkgName}` });
    }
  }

  // Check ownership conflicts across lockfile
  const lockOwners = {};
  for (const [pkgName, pkgData] of Object.entries(lock.packages || {})) {
    for (const targetPath of Object.keys(pkgData.files || {})) {
      const existing = lockOwners[targetPath];
      if (existing && existing !== pkgName) {
        result.issues.push({ type: 'OWNERSHIP_CONFLICT', detail: `"${targetPath}" owned by "${existing}" and "${pkgName}"` });
      }
      lockOwners[targetPath] = pkgName;
    }
  }

  // Partially installed packages (handled per-file above)

  // Collect all issues for status determination
  const allIssues = [...result.issues];
  for (const pkg of result.packages) allIssues.push(...pkg.issues);

  if (allIssues.length > 0) {
    result.status = allIssues.some(i => ['MANAGED_FILE_MODIFIED', 'LOCKFILE_INVALID', 'OWNERSHIP_CONFLICT', 'MANIFEST_INVALID'].includes(i.type)) ? 'FAILED' : 'WARNINGS';
  }

  writeResult(result);
  return result.status === 'PASSED' ? EXIT_OK : EXIT_CONFLICT;
}

function checkOrphanFiles(dir, prefix, ownedPaths, result) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git'].includes(entry.name)) {
        checkOrphanFiles(full, relative, ownedPaths, result);
      }
    } else if (entry.isFile()) {
      if (relative === '.devflow/devflow-lock.json') continue;
      if (relative === '.devflow/devflow-lock.json.tmp') continue;
      if (!ownedPaths.has(relative)) {
        result.issues.push({ type: 'ORPHAN_FILE', path: relative });
      }
    }
  }
}

function writeResult(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function printUsage() {
  const usage = `DevFlow Installer v1.0.0

Usage:
  node bin/devflow.mjs init <package>   Install a DevFlow package
  node bin/devflow.mjs audit            Audit installed packages
  node bin/devflow.mjs --help           Show this help

Packages:
  shared-runtime       Herramientas compartidas de runtime
  software-architect   Espacio de trabajo del Software Architect
  task-planner         Espacio de trabajo del Task Planner
  next-task            Contratos de selección determinista
  execution            Estado mutable y herramientas de orquestación
  context-builder      Schemas y templates de contexto ejecutable

Metapackages:
  planning-stack       shared-runtime + software-architect + task-planner
  execution-stack      shared-runtime + next-task + execution + context-builder
  all                  planning-stack + execution-stack

Exit codes:
  0  Operation successful
  1  Conflict or audit failure
  2  Usage error or internal failure
`;
  process.stderr.write(usage);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(EXIT_OK);
  }

  const command = args[0];

  switch (command) {
    case 'init':
      process.exit(cmdInit(args.slice(1)));
    case 'audit':
      process.exit(cmdAudit());
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      printUsage();
      process.exit(EXIT_ERROR);
  }
}

main();
