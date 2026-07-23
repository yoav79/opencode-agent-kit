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

"$REPO_ROOT/scripts/install.sh" --config-dir "$CONFIG_DIR"

[ -L "$CONFIG_DIR/agents/software-architect.md" ]
[ -L "$CONFIG_DIR/skills/software-blueprint" ]
[ -L "$CONFIG_DIR/commands/new-blueprint.md" ]
[ ! -e "$CONFIG_DIR/AGENTS.md" ]

"$REPO_ROOT/scripts/create-project.sh" "$PROJECT_DIR"

[ -f "$PROJECT_DIR/AGENTS.md" ]
[ -f "$PROJECT_DIR/software-design/project-state.json" ]
[ -d "$PROJECT_DIR/software-design/decisions" ]

python3 - "$PROJECT_DIR/software-design/project-state.json" <<'PY'
import json
import sys
from pathlib import Path

state = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
assert state["project"]["name"] == "example-project"
assert state["workflow"]["currentPhase"] == "discovery"
PY

"$REPO_ROOT/scripts/uninstall.sh" --config-dir "$CONFIG_DIR"

[ ! -e "$CONFIG_DIR/agents/software-architect.md" ]
[ ! -e "$CONFIG_DIR/skills/software-blueprint" ]
[ ! -e "$CONFIG_DIR/commands/new-blueprint.md" ]

echo "Script tests passed"
