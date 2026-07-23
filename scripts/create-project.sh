#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEMPLATES_DIR="$REPO_ROOT/templates"
FORCE=0
LIST=0

usage() {
  cat <<USAGE
Usage: ./scripts/create-project.sh [options] AGENT_NAME PROJECT_PATH

Creates a project scaffold for the specified agent.

Available agents:
USAGE

  for dir in "$TEMPLATES_DIR"/*/; do
    agent=$(basename "$dir")
    if [ -f "$dir/scaffold.json" ]; then
      target_dir=$(python3 -c "import json; print(json.loads(open('$dir/scaffold.json').read()).get('directory', '?'))" 2>/dev/null || echo "?")
      printf "  %-25s scaffold -> %s/\n" "$agent" "$target_dir"
    fi
  done

  cat <<USAGE

Options:
  --force     Overwrite existing scaffold directory
  --list      List available agents and exit
  -h, --help  Show this help
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    --list) LIST=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) break ;;
  esac
done

if [ "$LIST" -eq 1 ]; then usage; exit 0; fi

if [ "$#" -lt 2 ]; then
  echo "Error: AGENT_NAME and PROJECT_PATH are required." >&2
  usage >&2
  exit 2
fi

AGENT_NAME=$1
PROJECT_PATH=$2
SCAFFOLD_FILE="$TEMPLATES_DIR/$AGENT_NAME/scaffold.json"

if [ ! -f "$SCAFFOLD_FILE" ]; then
  echo "Error: Agent '$AGENT_NAME' not found. No scaffold.json in $TEMPLATES_DIR/$AGENT_NAME" >&2
  echo "Available agents:" >&2
  for dir in "$TEMPLATES_DIR"/*/; do
    [ -f "$dir/scaffold.json" ] && echo "  $(basename "$dir")" >&2
  done
  exit 1
fi

python3 - "$SCAFFOLD_FILE" "$TEMPLATES_DIR/$AGENT_NAME" "$PROJECT_PATH" "$FORCE" <<'PY'
import json
import os
import shutil
import sys
from pathlib import Path

scaffold_file = Path(sys.argv[1])
agent_dir = Path(sys.argv[2])
project_path = Path(sys.argv[3])
force = sys.argv[4] == "1"

scaffold = json.loads(scaffold_file.read_text(encoding="utf-8"))
dir_name = scaffold["directory"]
files = scaffold.get("files", [])
dirs = scaffold.get("dirs", [])
tool_files = scaffold.get("toolFiles", [])
command = scaffold.get("command", "")

project_path.mkdir(parents=True, exist_ok=True)
target = project_path / dir_name

if target.exists() and not force:
    print(f"Refusing to overwrite: {target}", file=sys.stderr)
    print("Use --force only after reviewing the existing directory.", file=sys.stderr)
    sys.exit(1)

if target.exists() and force:
    shutil.rmtree(target)

target.mkdir(parents=True, exist_ok=True)

for d in dirs:
    (target / d).mkdir(parents=True, exist_ok=True)

for f in files:
    src = agent_dir / f
    if src.exists():
        shutil.copy2(src, target / f)

for t in tool_files:
    src = agent_dir / t
    if src.exists():
        dest = target / t
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)

agents_md = scaffold.get("agentsMd", "")
if agents_md:
    agents_file = project_path / "AGENTS.md"
    if not agents_file.exists():
        agents_file.write_text(agents_md, encoding="utf-8")

project_name = project_path.name
state_file = target / "project-state.json"
if state_file.exists():
    data = json.loads(state_file.read_text(encoding="utf-8"))
    if "project" in data:
        data["project"]["name"] = project_name
        if "workingTitle" in data["project"]:
            data["project"]["workingTitle"] = project_name
    state_file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print(f"Created scaffold for '{Path(scaffold_file).parent.name}':")
print(f"  {target}/")
print()
print("Files created:")
for f in files:
    print(f"  {dir_name}/{f}")
for t in tool_files:
    print(f"  {dir_name}/{t}")

if command:
    print()
    print("Next:")
    print(f"  cd \"{project_path}\"")
    print("  opencode")
    print(f"  {command}")
PY
