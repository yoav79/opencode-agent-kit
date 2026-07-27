#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
DEVFLOW="$REPO_ROOT/bin/devflow.mjs"

PASS=0
FAIL=0

cleanup_all() {
  rm -rf "$TEMP_ROOT" 2>/dev/null || true
}
TEMP_ROOT=$(mktemp -d)
trap cleanup_all EXIT

pass() { PASS=$((PASS + 1)); }
fail() { FAIL=$((FAIL + 1)); echo "FAIL: $*"; }

run_devflow() {
  local dir=$1
  shift
  cd "$dir" && node "$DEVFLOW" "$@" 2>&1 || true
}

# --- Basic installation ---
echo "=== Basic installation ==="

test_single_package() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  local result
  result=$(run_devflow "$dir" init shared-runtime)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

  if [ "$status" != "INSTALLED" ]; then
    fail "single package: expected INSTALLED, got $status"; return
  fi
  if [ ! -f "$dir/.devflow/shared/tools/devflow-runtime-helpers.mjs" ]; then
    fail "single package: devflow-runtime-helpers.mjs not installed"; return
  fi
  pass "single package"
}

test_with_deps() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  local result
  result=$(run_devflow "$dir" init task-planner)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

  if [ "$status" != "INSTALLED" ]; then
    fail "with deps: expected INSTALLED, got $status"; return
  fi
  if [ ! -f "$dir/.devflow/task-planner/project-state.json" ]; then
    fail "with deps: project-state.json not installed"; return
  fi
  if [ ! -f "$dir/.devflow/shared/tools/devflow-runtime-helpers.mjs" ]; then
    fail "with deps: shared dependency not installed"; return
  fi
  pass "with deps"
}

test_planning_stack() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  local result
  result=$(run_devflow "$dir" init planning-stack)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

  if [ "$status" != "INSTALLED" ]; then
    fail "planning-stack: expected INSTALLED, got $status"; return
  fi
  for f in ".devflow/software-architect/project-state.json" ".devflow/task-planner/project-state.json" ".devflow/shared/tools/devflow-runtime-helpers.mjs"; do
    if [ ! -f "$dir/$f" ]; then
      fail "planning-stack: missing $f"; return
    fi
  done
  pass "planning-stack"
}

test_execution_stack() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  local result
  result=$(run_devflow "$dir" init execution-stack)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

  if [ "$status" != "INSTALLED" ]; then
    fail "execution-stack: expected INSTALLED, got $status"; return
  fi
  for f in ".devflow/execution/execution-state.json" ".devflow/execution/selection.json" ".devflow/execution/context-build-request.schema.json" ".devflow/shared/tools/devflow-runtime-helpers.mjs"; do
    if [ ! -f "$dir/$f" ]; then
      fail "execution-stack: missing $f"; return
    fi
  done
  pass "execution-stack"
}

test_all() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  local result
  result=$(run_devflow "$dir" init all)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

  if [ "$status" != "INSTALLED" ]; then
    fail "all metapackage: expected INSTALLED, got $status"; return
  fi
  for f in ".devflow/software-architect/project-state.json" ".devflow/task-planner/project-state.json" ".devflow/execution/execution-state.json" ".devflow/execution/selection.json" ".devflow/execution/context-build-request.schema.json"; do
    if [ ! -f "$dir/$f" ]; then
      fail "all metapackage: missing $f"; return
    fi
  done
  pass "all metapackage"
}

test_single_package
test_with_deps
test_planning_stack
test_execution_stack
test_all

# --- Idempotence ---
echo "=== Idempotence ==="

test_idempotent() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init execution-stack >/dev/null
  local result
  result=$(run_devflow "$dir" init execution-stack)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

  if [ "$status" != "ALREADY_INSTALLED" ]; then
    fail "idempotent: expected ALREADY_INSTALLED, got $status"; return
  fi
  local installed_files
  installed_files=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['installedFiles']))")
  if [ "$installed_files" != "0" ]; then
    fail "idempotent: expected 0 installed files, got $installed_files"; return
  fi
  pass "idempotent"
}

test_idempotent

# --- Shared directory ownership ---
echo "=== Shared directory ==="

test_shared_directory() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init next-task >/dev/null
  run_devflow "$dir" init execution >/dev/null

  if [ ! -f "$dir/.devflow/execution/selection.json" ]; then
    fail "shared dir: next-task selection.json removed by execution install"; return
  fi
  if [ ! -f "$dir/.devflow/execution/execution-state.json" ]; then
    fail "shared dir: execution-state.json not installed"; return
  fi

  run_devflow "$dir" init context-builder >/dev/null

  if [ ! -f "$dir/.devflow/execution/selection.json" ]; then
    fail "shared dir: next-task selection.json removed by context-builder install"; return
  fi
  if [ ! -f "$dir/.devflow/execution/execution-state.json" ]; then
    fail "shared dir: execution-state.json removed by context-builder install"; return
  fi
  if [ ! -f "$dir/.devflow/execution/context-build-request.schema.json" ]; then
    fail "shared dir: context-build-request.schema.json not installed"; return
  fi
  pass "shared directory"
}

test_shared_directory

# --- Mutable vs managed files ---
echo "=== Mutable vs managed ==="

test_mutable_preserved() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init execution >/dev/null

  echo '{"modified":true}' > "$dir/.devflow/execution/execution-state.json"

  local result
  result=$(run_devflow "$dir" init execution)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

  if [ "$status" != "ALREADY_INSTALLED" ]; then
    fail "mutable preserved: expected ALREADY_INSTALLED, got $status"; return
  fi

  local content
  content=$(cat "$dir/.devflow/execution/execution-state.json")
  if [ "$content" != '{"modified":true}' ]; then
    fail "mutable preserved: file was overwritten"; return
  fi
  pass "mutable preserved"
}

test_managed_conflict() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init execution >/dev/null

  echo 'modified' > "$dir/.devflow/execution/execution-state.schema.json"

  local result
  result=$(run_devflow "$dir" init execution)

  if echo "$result" | python3 -c "
import json,sys
d=json.load(sys.stdin)
exit(0 if any(c['classification']=='MANAGED_FILE_MODIFIED' for c in d.get('conflicts',[])) else 1)
" 2>/dev/null; then
    pass "managed conflict"
  else
    fail "managed conflict: expected MANAGED_FILE_MODIFIED"
  fi
}

test_mutable_preserved
test_managed_conflict

# --- Dependency resolution ---
echo "=== Dependencies ==="

test_unknown_package() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  local result
  result=$(run_devflow "$dir" init nonexistent-package)
  if echo "$result" | python3 -c "import json,sys; exit(0 if json.load(sys.stdin)['status']=='INVALID_PACKAGE' else 1)" 2>/dev/null; then
    pass "unknown package"
  else
    fail "unknown package: expected INVALID_PACKAGE"
  fi
}

test_unknown_package

# --- Lockfile ---
echo "=== Lockfile ==="

test_lockfile() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init execution-stack >/dev/null

  if [ ! -f "$dir/.devflow/devflow-lock.json" ]; then
    fail "lockfile: devflow-lock.json not created"; return
  fi

  python3 -c "
import json
with open('$dir/.devflow/devflow-lock.json') as f:
    d = json.load(f)
assert d.get('schemaVersion') == 1, f'schemaVersion={d.get(\"schemaVersion\")}'
assert d.get('installerVersion') == '1.0.0'
pkgs = d.get('packages', {})
assert len(pkgs) >= 4, f'expected >=4 packages, got {len(pkgs)}'
print('lockfile: OK')
" || { fail "lockfile: validation failed"; return; }
  pass "lockfile"
}

test_lockfile

# --- Audit ---
echo "=== Audit ==="

test_audit_ok() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init execution-stack >/dev/null

  local result
  result=$(run_devflow "$dir" audit)
  local status
  status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "FAIL_PARSE")

  if [ "$status" = "PASSED" ]; then
    pass "audit passed"
  else
    fail "audit: expected PASSED, got $status"
  fi
}

test_audit_missing_file() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init execution >/dev/null
  rm "$dir/.devflow/execution/execution-state.schema.json"

  local result
  result=$(run_devflow "$dir" audit)

  if echo "$result" | python3 -c "
import json,sys
d=json.load(sys.stdin)
exit(0 if any(i['type']=='MANAGED_FILE_MISSING' for p in d['packages'] for i in p['issues']) else 1)
" 2>/dev/null; then
    pass "audit missing file"
  else
    fail "audit missing file: expected MANAGED_FILE_MISSING"
  fi
}

test_audit_modified_file() {
  local dir
  dir=$(mktemp -d -p "$TEMP_ROOT")
  mkdir -p "$dir/.devflow"

  run_devflow "$dir" init execution >/dev/null
  echo 'modified' > "$dir/.devflow/execution/execution-state.schema.json"

  local result
  result=$(run_devflow "$dir" audit)

  if echo "$result" | python3 -c "
import json,sys
d=json.load(sys.stdin)
exit(0 if any(i['type']=='MANAGED_FILE_MODIFIED' for p in d['packages'] for i in p['issues']) else 1)
" 2>/dev/null; then
    pass "audit modified file"
  else
    fail "audit modified file: expected MANAGED_FILE_MODIFIED"
  fi
}

test_audit_ok
test_audit_missing_file
test_audit_modified_file

# --- CLI error handling ---
echo "=== CLI errors ==="

test_help() {
  if node "$DEVFLOW" --help 2>&1 | grep -q "DevFlow Installer"; then
    pass "help"
  else
    fail "help: missing DevFlow Installer"
  fi
}

test_unknown_command() {
  if node "$DEVFLOW" unknown-cmd 2>&1; then
    fail "unknown command: should have failed"; return
  fi
  pass "unknown command"
}

test_help
test_unknown_command

echo ""
echo "=== Results ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
