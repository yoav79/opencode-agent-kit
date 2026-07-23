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
    "opencode/agents/software-architect.md",
    "opencode/agents/requirements-analyst.md",
    "opencode/agents/architecture-reviewer.md",
    "opencode/commands/new-blueprint.md",
    "opencode/commands/continue-blueprint.md",
    "opencode/commands/validate-blueprint.md",
    "templates/software-design-project/software-design/project-state.json",
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

skill_name_re = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
for skill_dir in sorted((root / "opencode/skills").iterdir()):
    if not skill_dir.is_dir():
        continue
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.exists():
        errors.append(f"Missing SKILL.md: {skill_dir.relative_to(root)}")
        continue
    text = skill_file.read_text(encoding="utf-8")
    match = frontmatter_re.match(text)
    if not match:
        errors.append(f"Missing skill frontmatter: {skill_file.relative_to(root)}")
        continue
    frontmatter = match.group(1)
    name_match = re.search(r"^name:\s*(\S+)", frontmatter, re.MULTILINE)
    description_match = re.search(r"^description:\s*(.+)$", frontmatter, re.MULTILINE)
    if not name_match:
        errors.append(f"Missing skill name: {skill_file.relative_to(root)}")
    else:
        name = name_match.group(1)
        if name != skill_dir.name:
            errors.append(f"Skill name does not match directory: {skill_file.relative_to(root)}")
        if not skill_name_re.fullmatch(name):
            errors.append(f"Invalid skill name: {name}")
    if not description_match or not description_match.group(1).strip():
        errors.append(f"Missing skill description: {skill_file.relative_to(root)}")

for path in sorted((root / "opencode/commands").glob("*.md")):
    text = path.read_text(encoding="utf-8")
    match = frontmatter_re.match(text)
    if not match:
        errors.append(f"Missing command frontmatter: {path.relative_to(root)}")
        continue
    frontmatter = match.group(1)
    if not re.search(r"^description:\s*\S", frontmatter, re.MULTILINE):
        errors.append(f"Missing command description: {path.relative_to(root)}")

state_path = root / "templates/software-design-project/software-design/project-state.json"
if state_path.exists():
    state = json.loads(state_path.read_text(encoding="utf-8"))
    expected_phases = {"discovery", "requirements", "architecture", "delivery-plan", "validation"}
    phases = set(state.get("workflow", {}).get("phases", {}))
    if phases != expected_phases:
        errors.append(f"Unexpected phase set: {sorted(phases)}")

if errors:
    print("Validation failed:")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("Validation passed")
PY
