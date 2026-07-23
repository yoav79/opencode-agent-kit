#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

python3 - "$REPO_ROOT" <<'PY'
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
errors = []

required_paths = [
    "README.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "LICENSE",
    "Makefile",
    "opencode/AGENTS.md",
    "opencode/agents/software-architect.md",
    "opencode/agents/task-planner.md",
    "opencode/commands/init-software-architect.md",
    "opencode/commands/init-task-planner.md",
    "opencode/rules/general.md",
    "opencode/rules/git-policy.md",
    "opencode/rules/documentation-policy.md",
    "templates/software-architect/project-state.json",
    "templates/software-architect/workflow.md",
    "templates/software-architect/scaffold.json",
    "templates/task-planner/project-state.json",
    "templates/task-planner/workflow.md",
    "templates/task-planner/scaffold.json",
    "templates/task-planner/semantic-contract.json",
    "templates/task-planner/requirements.json",
    "templates/task-planner/capability-map.json",
    "templates/task-planner/epic-plan.json",
    "templates/task-planner/task-plan.json",
    "templates/task-planner/task-template.md",
    "templates/task-planner/tools/validate-plan.mjs",
    "templates/task-planner/tools/update-timestamps.mjs",
    "templates/task-planner/tools/build-epic-graph.mjs",
    "scripts/install.sh",
    "scripts/uninstall.sh",
    "scripts/create-project.sh",
    "scripts/validate.sh",
]

for relative in required_paths:
    if not (root / relative).exists():
        errors.append(f"Missing required path: {relative}")

for path in root.rglob("*.json"):
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid JSON {path.relative_to(root)}: {exc}")

frontmatter_re = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)

for path in sorted((root / "opencode/agents").glob("*.md")):
    text = path.read_text(encoding="utf-8")
    match = frontmatter_re.match(text)
    if not match:
        errors.append(f"Missing frontmatter: {path.relative_to(root)}")
        continue
    frontmatter = match.group(1)
    if not re.search(r"^description:\s*\S", frontmatter, re.MULTILINE):
        errors.append(f"Missing description: {path.relative_to(root)}")
    mode = re.search(r"^mode:\s*(\S+)", frontmatter, re.MULTILINE)
    if not mode or mode.group(1) not in {"primary", "subagent", "all"}:
        errors.append(f"Invalid mode: {path.relative_to(root)}")
    if "permission:" not in frontmatter:
        errors.append(f"Missing permissions: {path.relative_to(root)}")

for path in sorted((root / "opencode/commands").glob("*.md")):
    text = path.read_text(encoding="utf-8")
    match = frontmatter_re.match(text)
    if not match:
        errors.append(f"Missing command frontmatter: {path.relative_to(root)}")
        continue
    frontmatter = match.group(1)
    if not re.search(r"^description:\s*\S", frontmatter, re.MULTILINE):
        errors.append(f"Missing command description: {path.relative_to(root)}")
    if not re.search(r"^agent:\s*\S", frontmatter, re.MULTILINE):
        errors.append(f"Missing command agent: {path.relative_to(root)}")

sa_state = root / "templates/software-architect/project-state.json"
if sa_state.exists():
    try:
        state = json.loads(sa_state.read_text(encoding="utf-8"))
        phases = state.get("phases", {})
        if len(phases) < 10:
            errors.append(f"software-architect project-state.json has only {len(phases)} phases, expected >= 10")
    except Exception as exc:
        errors.append(f"Error reading software-architect state: {exc}")

tp_state = root / "templates/task-planner/project-state.json"
if tp_state.exists():
    try:
        state = json.loads(tp_state.read_text(encoding="utf-8"))
        schema = state.get("schemaVersion")
        if schema != 3:
            errors.append(f"task-planner schemaVersion = {schema}, expected 3")
        planner = state.get("planner", {})
        if planner.get("workflowVersion") != 7:
            errors.append(f"task-planner workflowVersion = {planner.get('workflowVersion')}, expected 7")
        if planner.get("validatorVersion") != "3.5":
            errors.append(f"task-planner validatorVersion = {planner.get('validatorVersion')}, expected 3.5")
    except Exception as exc:
        errors.append(f"Error reading task-planner state: {exc}")

for agent_dir in sorted(root.glob("templates/*/")):
    scaffold_file = agent_dir / "scaffold.json"
    if not scaffold_file.exists():
        continue
    try:
        scaffold = json.loads(scaffold_file.read_text(encoding="utf-8"))
        if "directory" not in scaffold:
            errors.append(f"scaffold.json missing 'directory': {scaffold_file.relative_to(root)}")
        if "files" not in scaffold:
            errors.append(f"scaffold.json missing 'files': {scaffold_file.relative_to(root)}")
        for f in scaffold.get("files", []):
            if not (agent_dir / f).exists():
                errors.append(f"scaffold.json references missing file {f}: {scaffold_file.relative_to(root)}")
    except Exception as exc:
        errors.append(f"Error reading {scaffold_file.relative_to(root)}: {exc}")

if errors:
    print("Validation failed:")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("Validation passed")
PY
