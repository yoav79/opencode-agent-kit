#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
FORCE=0

usage() {
  cat <<USAGE
Usage: ./scripts/generate-scaffold.sh [options] AGENT_NAME

Generates or updates scaffold.json for an agent by introspecting
its configuration, templates, and associated commands.

Options:
  --force     Overwrite existing scaffold.json completely
  -h, --help  Show this help

Available agents:
USAGE

  for dir in "$REPO_ROOT/templates"/*/; do
    [ -f "$dir/project-state.json" ] && printf "  %s\n" "$(basename "$dir")"
  done
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) AGENT_NAME=${AGENT_NAME:-$1}; shift ;;
  esac
done

AGENT_NAME=${AGENT_NAME:-}

if [ -z "$AGENT_NAME" ]; then
  echo "Error: AGENT_NAME is required." >&2
  usage >&2
  exit 2
fi

AGENT_DIR="$REPO_ROOT/templates/$AGENT_NAME"
AGENT_FILE="$REPO_ROOT/opencode/agents/$AGENT_NAME.md"
SCAFFOLD_FILE="$AGENT_DIR/scaffold.json"

if [ ! -d "$AGENT_DIR" ]; then
  echo "Error: No templates directory for agent '$AGENT_NAME'" >&2
  exit 1
fi

if [ ! -f "$AGENT_FILE" ]; then
  echo "Error: Agent file not found: opencode/agents/$AGENT_NAME.md" >&2
  exit 1
fi

python3 - "$REPO_ROOT" "$AGENT_NAME" "$FORCE" <<'PY'
import json
import os
import re
import sys
from pathlib import Path

repo_root = Path(sys.argv[1])
agent_name = sys.argv[2]
force = sys.argv[3] == "1"

agent_dir = repo_root / "templates" / agent_name
agent_file = repo_root / "opencode" / "agents" / f"{agent_name}.md"
scaffold_file = agent_dir / "scaffold.json"
commands_dir = repo_root / "opencode" / "commands"

def parse_frontmatter(text):
    match = re.match(r"\A---\n(.*?)\n---\n", text, re.DOTALL)
    if not match:
        return None
    raw = match.group(1)
    result = {}
    for line in raw.splitlines():
        if ":" in line and not line.startswith(" "):
            key, _, val = line.partition(":")
            result[key.strip()] = val.strip()
    return result

def find_command():
    if not commands_dir.exists():
        return ""
    for cmd_file in sorted(commands_dir.glob("*.md")):
        text = cmd_file.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        if fm and fm.get("agent") == agent_name:
            return cmd_file.stem
    return ""

def infer_directory():
    scaffolds = {"software-architect": ".devflow/software-architect", "task-planner": ".devflow/task-planner"}
    if agent_name in scaffolds:
        return scaffolds[agent_name]
    return agent_name.replace("-", "_")

def scan_templates():
    files, dirs, tool_files = [], [], []
    for item in sorted(agent_dir.iterdir()):
        if item.name in ("scaffold.json", "SKILL.md"):
            continue
        if item.is_file():
            files.append(item.name)
        elif item.is_dir():
            if item.name == "tools":
                for tool in sorted(item.iterdir()):
                    if tool.is_file() and not tool.name.endswith((".test.mjs", ".test.js")):
                        tool_files.append(f"tools/{tool.name}")
            else:
                dirs.append(item.name)
    return files, dirs, tool_files

def infer_dirs_from_agent(directory):
    text = agent_file.read_text(encoding="utf-8")
    dirs = []
    for m in re.finditer(r'"mkdir -p ([^"]+)"', text):
        for part in m.group(1).split():
            if "/" not in part and part != "-p" and part != directory and part not in dirs:
                dirs.append(part)
    return dirs

def infer_dirs_from_state(directory):
    state_file = agent_dir / "project-state.json"
    if not state_file.exists():
        return []
    try:
        data = json.loads(state_file.read_text(encoding="utf-8"))
    except Exception:
        return []

    dirs = set()
    for val in data.get("documents", {}).values():
        path = val.get("path", "")
        parts = path.split("/")
        if len(parts) >= 3:
            dirs.add(parts[1])

    for val in data.get("artifacts", {}).values():
        path = val.get("path", "")
        parts = path.split("/")
        if len(parts) == 2 and "." not in parts[1]:
            dirs.add(parts[1])
        elif len(parts) >= 3:
            dirs.add(parts[1])

    if "docs" in dirs:
        for d in ["drafts", "decisions", "archive"]:
            dirs.add(d)

    dirs.discard(directory)

    standard = ["docs", "drafts", "decisions", "archive", "epics", "tasks", "tools"]
    result = [d for d in standard if d in dirs]
    for d in sorted(dirs):
        if d not in result:
            result.append(d)
    return result

def build_scaffold():
    directory = infer_directory()
    command = find_command()
    files, template_dirs, tool_files = scan_templates()
    dirs_from_agent = infer_dirs_from_agent(directory)
    dirs_from_state = infer_dirs_from_state(directory)

    all_dirs = []
    for d in dirs_from_agent + dirs_from_state:
        if d not in all_dirs:
            all_dirs.append(d)

    scaffold = {
        "directory": directory,
        "files": files,
        "dirs": template_dirs if template_dirs else all_dirs,
    }

    if tool_files:
        scaffold["toolFiles"] = tool_files
    if command:
        scaffold["command"] = f"/{command}"

    state_file = agent_dir / "project-state.json"
    if state_file.exists():
        try:
            data = json.loads(state_file.read_text(encoding="utf-8"))
            if "phases" in data:
                scaffold["phases"] = list(data["phases"].keys())
        except Exception:
            pass

    agent_text = agent_file.read_text(encoding="utf-8")
    fm = parse_frontmatter(agent_text)
    if fm:
        scaffold["agent"] = {
            "description": fm.get("description", ""),
            "mode": fm.get("mode", ""),
            "temperature": fm.get("temperature", ""),
        }

    return scaffold

existing_agents_md = ""
if scaffold_file.exists():
    try:
        existing = json.loads(scaffold_file.read_text(encoding="utf-8"))
        existing_agents_md = existing.get("agentsMd", "")
    except Exception:
        pass

scaffold = build_scaffold()

if existing_agents_md and "agentsMd" not in scaffold:
    scaffold["agentsMd"] = existing_agents_md

if scaffold_file.exists() and not force:
    existing = json.loads(scaffold_file.read_text(encoding="utf-8"))
    if existing == scaffold:
        print(f"scaffold.json is already up to date for '{agent_name}'")
        sys.exit(0)
    print(f"Updating scaffold.json for '{agent_name}'...")
    print()
    print("Changes:")
    for key in sorted(set(list(existing.keys()) + list(scaffold.keys()))):
        old_val = existing.get(key)
        new_val = scaffold.get(key)
        if old_val != new_val:
            print(f"  {key}:")
            print(f"    - {json.dumps(old_val, ensure_ascii=False)}")
            print(f"    + {json.dumps(new_val, ensure_ascii=False)}")
else:
    print(f"Creating scaffold.json for '{agent_name}'...")

scaffold_file.write_text(
    json.dumps(scaffold, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

print()
print(f"Written: templates/{agent_name}/scaffold.json")
print(f"  directory: {scaffold['directory']}")
print(f"  files: {len(scaffold['files'])}")
print(f"  dirs: {len(scaffold['dirs'])}")
if scaffold.get("toolFiles"):
    print(f"  toolFiles: {len(scaffold['toolFiles'])}")
if scaffold.get("command"):
    print(f"  command: {scaffold['command']}")
PY
