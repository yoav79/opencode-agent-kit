#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEST_ROOT=$(mktemp -d)
CONFIG_DIR="$TEST_ROOT/config"
PROJECT_DIR="$TEST_ROOT/example-project"
EXECUTION_PROJECT_DIR="$TEST_ROOT/execution-project"
REINIT_PROJECT_DIR="$TEST_ROOT/execution-project-reinit"
NEXT_TASK_PROJECT_DIR="$TEST_ROOT/next-task-project"
EXECUTION_TS="2026-07-26T10:00:00.000Z"

install_template_from_scaffold() {
  local template_dir=$1
  local project_dir=$2
  local label=$3

  python3 - "$template_dir" "$project_dir" "$label" <<'PY'
import json
import shutil
import sys
from pathlib import Path

template_dir = Path(sys.argv[1])
project_dir = Path(sys.argv[2])
label = sys.argv[3]

scaffold = json.loads((template_dir / "scaffold.json").read_text(encoding="utf-8"))
target = project_dir / scaffold["directory"]
target.mkdir(parents=True, exist_ok=True)

for relative in scaffold.get("dirs", []):
    (target / relative).mkdir(parents=True, exist_ok=True)

for relative in scaffold.get("files", []):
    src = template_dir / relative
    if not src.exists():
        raise SystemExit(f"FAIL: {label}: missing template source {src}")
    dest = target / relative
    if dest.exists():
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
PY
}

assert_scaffold_materialized() {
  local template_dir=$1
  local project_dir=$2
  local label=$3

  python3 - "$template_dir" "$project_dir" "$label" <<'PY'
import json
import sys
from pathlib import Path

template_dir = Path(sys.argv[1])
project_dir = Path(sys.argv[2])
label = sys.argv[3]

scaffold = json.loads((template_dir / "scaffold.json").read_text(encoding="utf-8"))
target = project_dir / scaffold["directory"]

missing = []
for relative in scaffold.get("dirs", []):
    if not (target / relative).is_dir():
        missing.append(f"dir:{scaffold['directory']}/{relative}/")
for relative in scaffold.get("files", []):
    if not (target / relative).is_file():
        missing.append(f"file:{scaffold['directory']}/{relative}")

if missing:
    raise SystemExit(f"FAIL: {label}: missing installed paths: {', '.join(missing)}")
PY
}

initialize_execution_state() {
  local project_dir=$1
  local timestamp=$2

  python3 - "$project_dir/.devflow/execution/execution-state.json" <<'PY'
import json
import re
import sys
from pathlib import Path

state_path = Path(sys.argv[1])
project_slug = re.sub(r"[^a-z0-9]+", "-", state_path.parents[2].name.lower()).strip("-") or "project"
state = json.loads(state_path.read_text(encoding="utf-8"))
state["project"]["id"] = project_slug
state["project"]["planningVersion"] = 1
state_path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
PY

  NODE_ENV=test TIMESTAMP_TOOL_TEST_NOW="$timestamp" \
    node "$project_dir/.devflow/execution/tools/touch-execution-state.mjs" \
    "$project_dir/.devflow/execution/execution-state.json" >/dev/null
}

write_minimal_selection() {
  local project_dir=$1

  python3 - "$project_dir/.devflow/execution/selection.json" <<'PY'
import json
import sys
from pathlib import Path

selection_path = Path(sys.argv[1])
selection = {
    "schemaVersion": 1,
    "sourceSnapshot": {
        "planningVersion": 1,
        "epicPlanContentHash": f"sha256:{'a' * 64}",
        "taskPlanContentHash": f"sha256:{'b' * 64}",
        "capabilityMapContentHash": f"sha256:{'c' * 64}",
        "executionStateRevision": 0,
    },
    "selectedTaskId": "TASK-006",
    "epicId": "EPIC-001",
    "executionWave": 1,
    "selectionReason": {
        "dependenciesCompleted": True,
        "attemptsAvailable": True,
        "taskStatus": "pending",
        "readyTaskCount": 1,
        "unlocksTaskIds": [],
        "tieBreaker": "lowest-execution-wave-then-lowest-task-id",
    },
    "otherReadyTaskIds": [],
    "classification": "TASK_SELECTED",
    "issues": [],
}
selection_path.write_text(json.dumps(selection, indent=2) + "\n", encoding="utf-8")
PY
}

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

echo "=== Testing install ==="
"$REPO_ROOT/scripts/install.sh" --config-dir "$CONFIG_DIR"

[ -L "$CONFIG_DIR/agents/software-architect.md" ] || { echo "FAIL: software-architect.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/agents/task-planner.md" ] || { echo "FAIL: task-planner.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/commands/init-software-architect.md" ] || { echo "FAIL: init-software-architect.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/commands/init-task-planner.md" ] || { echo "FAIL: init-task-planner.md symlink"; exit 1; }
echo "Install: OK"

echo "=== Testing create-project ==="
"$REPO_ROOT/scripts/create-project.sh" software-architect "$PROJECT_DIR"

[ -f "$PROJECT_DIR/AGENTS.md" ] || { echo "FAIL: AGENTS.md not created"; exit 1; }
[ -f "$PROJECT_DIR/.devflow/software-architect/project-state.json" ] || { echo "FAIL: project-state.json not created"; exit 1; }
[ -d "$PROJECT_DIR/.devflow/software-architect/decisions" ] || { echo "FAIL: decisions/ not created"; exit 1; }
[ -d "$PROJECT_DIR/.devflow/software-architect/docs" ] || { echo "FAIL: docs/ not created"; exit 1; }
[ -d "$PROJECT_DIR/.devflow/software-architect/drafts" ] || { echo "FAIL: drafts/ not created"; exit 1; }
[ -d "$PROJECT_DIR/.devflow/software-architect/archive" ] || { echo "FAIL: archive/ not created"; exit 1; }
[ -f "$PROJECT_DIR/.devflow/software-architect/workflow.md" ] || { echo "FAIL: workflow.md not created"; exit 1; }

python3 - "$PROJECT_DIR/.devflow/software-architect/project-state.json" <<'PY'
import json
import sys
from pathlib import Path

state = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
assert state["project"]["name"] == "example-project", f"Expected example-project, got {state['project']['name']}"
assert "phases" in state, "Missing phases field"
assert len(state["phases"]) >= 14, f"Expected >= 14 phases, got {len(state['phases'])}"
PY
echo "Create-project: OK"

echo "=== Testing standalone next-task installation ==="
mkdir -p "$NEXT_TASK_PROJECT_DIR"
install_template_from_scaffold "$CONFIG_DIR/templates/shared" "$NEXT_TASK_PROJECT_DIR" "shared-runtime"
install_template_from_scaffold "$CONFIG_DIR/templates/next-task" "$NEXT_TASK_PROJECT_DIR" "init-next-task-standalone"
assert_scaffold_materialized "$CONFIG_DIR/templates/shared" "$NEXT_TASK_PROJECT_DIR" "shared-runtime"
assert_scaffold_materialized "$CONFIG_DIR/templates/next-task" "$NEXT_TASK_PROJECT_DIR" "init-next-task-standalone"
[ -f "$NEXT_TASK_PROJECT_DIR/.devflow/shared/tools/devflow-runtime-helpers.mjs" ] || { echo "FAIL: shared helper not installed for next-task"; exit 1; }
echo "Standalone next-task install: OK"

echo "=== Testing execution runtime installation ==="
mkdir -p "$EXECUTION_PROJECT_DIR"

install_template_from_scaffold "$CONFIG_DIR/templates/shared" "$EXECUTION_PROJECT_DIR" "shared-runtime"
assert_scaffold_materialized "$CONFIG_DIR/templates/shared" "$EXECUTION_PROJECT_DIR" "shared-runtime"
install_template_from_scaffold "$CONFIG_DIR/templates/execution" "$EXECUTION_PROJECT_DIR" "init-execution"
assert_scaffold_materialized "$CONFIG_DIR/templates/execution" "$EXECUTION_PROJECT_DIR" "init-execution"
initialize_execution_state "$EXECUTION_PROJECT_DIR" "$EXECUTION_TS"

install_template_from_scaffold "$CONFIG_DIR/templates/next-task" "$EXECUTION_PROJECT_DIR" "init-next-task"
assert_scaffold_materialized "$CONFIG_DIR/templates/next-task" "$EXECUTION_PROJECT_DIR" "init-next-task"
write_minimal_selection "$EXECUTION_PROJECT_DIR"

PREPARE_STDOUT=$(mktemp)
PREPARE_STDERR=$(mktemp)
if ! NODE_ENV=test TIMESTAMP_TOOL_TEST_NOW="$EXECUTION_TS" \
  node "$EXECUTION_PROJECT_DIR/.devflow/execution/tools/prepare-task-run.mjs" \
  --root "$EXECUTION_PROJECT_DIR" >"$PREPARE_STDOUT" 2>"$PREPARE_STDERR"; then
  echo "FAIL: prepare-task-run failed on freshly initialized project" >&2
  cat "$PREPARE_STDERR" >&2
  exit 1
fi

python3 - "$PREPARE_STDOUT" "$EXECUTION_PROJECT_DIR/.devflow/execution/execution-state.json" <<'PY'
import json
import sys
from pathlib import Path

report = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
state = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))

assert report["classification"] == "RUN_PREPARED", report
assert report["taskId"] == "TASK-006", report
assert report["attempt"] == 1, report
assert state["revision"] == 1, state
assert state["tasks"][0]["reservation"]["token"] == ".devflow/execution/runs/TASK-006/attempt-01", state
PY

[ -f "$EXECUTION_PROJECT_DIR/.devflow/execution/runs/TASK-006/attempt-01/selection.json" ] || { echo "FAIL: selection evidence not created"; exit 1; }

cp -R "$EXECUTION_PROJECT_DIR" "$REINIT_PROJECT_DIR"
printf 'custom readme\n' > "$REINIT_PROJECT_DIR/.devflow/execution/README.md"
rm "$REINIT_PROJECT_DIR/.devflow/execution/tools/execution-transition-engine.mjs"
rm "$REINIT_PROJECT_DIR/.devflow/shared/tools/devflow-runtime-helpers.mjs"
install_template_from_scaffold "$CONFIG_DIR/templates/shared" "$REINIT_PROJECT_DIR" "shared-runtime-retry"
install_template_from_scaffold "$CONFIG_DIR/templates/execution" "$REINIT_PROJECT_DIR" "init-execution-retry"
[ -f "$REINIT_PROJECT_DIR/.devflow/execution/tools/execution-transition-engine.mjs" ] || { echo "FAIL: missing runtime file was not restored"; exit 1; }
[ -f "$REINIT_PROJECT_DIR/.devflow/shared/tools/devflow-runtime-helpers.mjs" ] || { echo "FAIL: missing shared helper was not restored"; exit 1; }
grep -q '^custom readme$' "$REINIT_PROJECT_DIR/.devflow/execution/README.md" || { echo "FAIL: existing execution README was overwritten"; exit 1; }

for missing_tool in execution-transition-engine.mjs execution-contract-helpers.mjs; do
  BROKEN_DIR="$TEST_ROOT/broken-${missing_tool%.mjs}"
  cp -R "$EXECUTION_PROJECT_DIR" "$BROKEN_DIR"
  rm "$BROKEN_DIR/.devflow/execution/tools/$missing_tool"
  if NODE_ENV=test TIMESTAMP_TOOL_TEST_NOW="$EXECUTION_TS" \
    node "$BROKEN_DIR/.devflow/execution/tools/prepare-task-run.mjs" \
    --root "$BROKEN_DIR" >"$PREPARE_STDOUT" 2>"$PREPARE_STDERR"; then
    echo "FAIL: prepare-task-run succeeded without $missing_tool" >&2
    exit 1
  fi
done

rm -f "$PREPARE_STDOUT" "$PREPARE_STDERR"
echo "Execution runtime install: OK"

echo "=== Testing uninstall ==="
"$REPO_ROOT/scripts/uninstall.sh" --config-dir "$CONFIG_DIR"

[ ! -e "$CONFIG_DIR/agents/software-architect.md" ] || { echo "FAIL: software-architect.md not removed"; exit 1; }
[ ! -e "$CONFIG_DIR/agents/task-planner.md" ] || { echo "FAIL: task-planner.md not removed"; exit 1; }
[ ! -e "$CONFIG_DIR/commands/init-software-architect.md" ] || { echo "FAIL: init-software-architect.md not removed"; exit 1; }
[ ! -e "$CONFIG_DIR/commands/init-task-planner.md" ] || { echo "FAIL: init-task-planner.md not removed"; exit 1; }
echo "Uninstall: OK"

echo ""
echo "All script tests passed"
