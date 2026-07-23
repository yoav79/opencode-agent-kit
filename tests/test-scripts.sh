#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEST_ROOT=$(mktemp -d)
CONFIG_DIR="$TEST_ROOT/config"
PROJECT_DIR="$TEST_ROOT/example-project"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

echo "=== Testing install ==="
"$REPO_ROOT/scripts/install.sh" --config-dir "$CONFIG_DIR"

[ -L "$CONFIG_DIR/agents/software-architect.md" ] || { echo "FAIL: software-architect.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/agents/requirements-analyst.md" ] || { echo "FAIL: requirements-analyst.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/agents/architecture-reviewer.md" ] || { echo "FAIL: architecture-reviewer.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/skills/software-blueprint" ] || { echo "FAIL: software-blueprint symlink"; exit 1; }
[ -L "$CONFIG_DIR/skills/requirements-discovery" ] || { echo "FAIL: requirements-discovery symlink"; exit 1; }
[ -L "$CONFIG_DIR/skills/architecture-review" ] || { echo "FAIL: architecture-review symlink"; exit 1; }
[ -L "$CONFIG_DIR/commands/new-blueprint.md" ] || { echo "FAIL: new-blueprint.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/commands/continue-blueprint.md" ] || { echo "FAIL: continue-blueprint.md symlink"; exit 1; }
[ -L "$CONFIG_DIR/commands/validate-blueprint.md" ] || { echo "FAIL: validate-blueprint.md symlink"; exit 1; }
[ ! -e "$CONFIG_DIR/AGENTS.md" ] || { echo "FAIL: AGENTS.md should not exist without --with-global-rules"; exit 1; }
echo "Install: OK"

echo "=== Testing create-project ==="
"$REPO_ROOT/scripts/create-project.sh" "$PROJECT_DIR"

[ -f "$PROJECT_DIR/AGENTS.md" ] || { echo "FAIL: AGENTS.md not created"; exit 1; }
[ -f "$PROJECT_DIR/software-design/project-state.json" ] || { echo "FAIL: project-state.json not created"; exit 1; }
[ -d "$PROJECT_DIR/software-design/decisions" ] || { echo "FAIL: decisions/ not created"; exit 1; }
[ -d "$PROJECT_DIR/software-design/docs" ] || { echo "FAIL: docs/ not created"; exit 1; }
[ -d "$PROJECT_DIR/software-design/drafts" ] || { echo "FAIL: drafts/ not created"; exit 1; }
[ -d "$PROJECT_DIR/software-design/archive" ] || { echo "FAIL: archive/ not created"; exit 1; }
[ -f "$PROJECT_DIR/software-design/workflow.md" ] || { echo "FAIL: workflow.md not created"; exit 1; }

python3 - "$PROJECT_DIR/software-design/project-state.json" <<'PY'
import json
import sys
from pathlib import Path

state = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
assert state["project"]["name"] == "example-project", f"Expected example-project, got {state['project']['name']}"
assert state["workflow"]["currentPhase"] == "discovery", f"Expected discovery, got {state['workflow']['currentPhase']}"
assert set(state["workflow"]["phases"].keys()) == {"discovery", "requirements", "architecture", "delivery-plan", "validation"}, f"Unexpected phases: {state['workflow']['phases'].keys()}"
PY
echo "Create-project: OK"

echo "=== Testing uninstall ==="
"$REPO_ROOT/scripts/uninstall.sh" --config-dir "$CONFIG_DIR"

[ ! -e "$CONFIG_DIR/agents/software-architect.md" ] || { echo "FAIL: software-architect.md not removed"; exit 1; }
[ ! -e "$CONFIG_DIR/skills/software-blueprint" ] || { echo "FAIL: software-blueprint not removed"; exit 1; }
[ ! -e "$CONFIG_DIR/commands/new-blueprint.md" ] || { echo "FAIL: new-blueprint.md not removed"; exit 1; }
echo "Uninstall: OK"

echo ""
echo "All script tests passed"
