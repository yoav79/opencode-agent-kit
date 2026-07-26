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
    "opencode/agents/blueprint-compiler.md",
    "opencode/agents/consistency-reviewer.md",
    "opencode/agents/task-planner.md",
    "opencode/commands/init-software-architect.md",
    "opencode/commands/compile-blueprint.md",
    "opencode/commands/review-consistency.md",
    "opencode/commands/init-task-planner.md",
    "opencode/rules/general.md",
    "opencode/rules/git-policy.md",
    "opencode/rules/documentation-policy.md",
    "templates/software-architect/project-state.json",
    "templates/software-architect/project-state.schema.json",
    "templates/software-architect/workflow.md",
    "templates/software-architect/scaffold.json",
    "templates/software-architect/tools/validate-blueprint.mjs",
    "templates/software-architect/tools/migrate-v1-to-v2.mjs",
    "templates/shared/tools/timestamp.mjs",
    "templates/software-architect/contracts/blueprint-compiler.md",
    "templates/software-architect/contracts/consistency-reviewer.md",
    "templates/task-planner/project-state.json",
    "templates/task-planner/workflow.md",
    "templates/task-planner/scaffold.json",
    "templates/task-planner/semantic-contract.json",
    "templates/task-planner/requirements.json",
    "templates/task-planner/capability-map.json",
    "templates/task-planner/epic-plan.json",
    "templates/task-planner/task-plan.json",
    "templates/task-planner/task-template.md",
    "templates/task-planner/tools/assemble-capability-map.mjs",
    "templates/task-planner/tools/assemble-epic-task-batch.mjs",
    "templates/task-planner/tools/render-task-markdown.mjs",
    "templates/task-planner/tools/reserve-task-ids.mjs",
    "templates/task-planner/tools/validate-capability-map.mjs",
    "templates/task-planner/tools/validate-epic-batch.mjs",
    "templates/task-planner/tools/validate-plan.mjs",
    "templates/task-planner/tools/update-timestamps.mjs",
    "templates/task-planner/tools/build-epic-graph.mjs",
    "templates/next-task/tools/select-next-task.mjs",
    "templates/next-task/tools/validate-next-task.mjs",
    "templates/execution/README.md",
    "templates/execution/execution-state.json",
    "templates/execution/execution-state.schema.json",
    "templates/execution/scaffold.json",
    "templates/execution/tools/execution-contract-helpers.mjs",
    "templates/execution/tools/execution-transition-engine.mjs",
    "templates/execution/tools/prepare-task-run.mjs",
    "templates/execution/tools/touch-execution-state.mjs",
    "scripts/install.sh",
    "scripts/uninstall.sh",
    "scripts/create-project.sh",
    "scripts/validate.sh",
    "scripts/publish-blueprint.sh",
]

for relative in required_paths:
    if not (root / relative).exists():
        errors.append(f"Missing required path: {relative}")

required_path_set = set(required_paths)
runtime_tools = [
    path
    for pattern in ("templates/*/tools/*.mjs", "templates/shared/tools/*.mjs")
    for path in root.glob(pattern)
    if not path.name.endswith(".test.mjs")
]
for path in sorted(runtime_tools):
    relative = path.relative_to(root).as_posix()
    if relative not in required_path_set:
        errors.append(f"Runtime tool missing from required_paths: {relative}")

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

sa_doc_templates = list((root / "templates/software-architect/doc-templates").glob("*.md"))
main_templates = [t for t in sa_doc_templates if t.name not in ("SKILL.md",)]
if len(main_templates) != 14:
    errors.append(f"software-architect doc-templates has {len(main_templates)} files, expected 14")

# --- Test coverage validation ---

known_test_targets = {
    "test-task-planner-tools": sorted(root.glob("templates/task-planner/tools/*.test.mjs")),
    "test-execution-tools": [
        root / "templates/execution/tools/prepare-task-run.test.mjs",
        root / "templates/execution/tools/execution-transition-engine.test.mjs",
    ],
    "test-agent-contracts": [
        root / "templates/execution/tools/contractual-tests.test.mjs",
    ],
}

for target_name, files in known_test_targets.items():
    if not files:
        errors.append(f"{target_name}: no test files found (glob returned empty)")
    for f in files:
        if not f.exists():
            errors.append(f"{target_name}: referenced test file does not exist: {f.relative_to(root)}")

all_covered = set()
for files in known_test_targets.values():
    all_covered.update(files)

all_test_files = set(root.glob("templates/*/tools/*.test.mjs"))
uncovered = sorted(all_test_files - all_covered)
for test_file in uncovered:
    relative = test_file.relative_to(root).as_posix()
    errors.append(f"Test file not covered by any make test-* target: {relative}")

# --- Contractual test: context-builder permissions ---

cb_agent = root / "opencode/agents/context-builder.md"
if cb_agent.exists():
    text = cb_agent.read_text(encoding="utf-8")
    match = frontmatter_re.match(text)
    if not match:
        errors.append("context-builder: missing frontmatter")
    else:
        fm = match.group(1)
        body = text[match.end():]

        # 1. mode must be subagent
        mode = re.search(r"^mode:\s*(\S+)", fm, re.MULTILINE)
        if not mode or mode.group(1) != "subagent":
            errors.append("context-builder: mode must be subagent")

        # 2. no edit permission for execution-state.json
        if re.search(r"execution-state\.json", fm):
            errors.append("context-builder: must not have any permission targeting execution-state.json")

        # 3. no edit permission for selection.json (any copy)
        edit_section = re.search(r"^  edit:\n((?:    .*\n?)*)", fm, re.MULTILINE)
        if edit_section:
            edit_actions = edit_section.group(1)
            if re.search(r"selection\.json", edit_actions):
                errors.append("context-builder: must not have edit permission for any selection.json")

        # 4. no mkdir in bash permissions
        if re.search(r"mkdir", fm):
            errors.append("context-builder: must not have mkdir permission")

        # 5. only authorized edit patterns: execution-context.json and execution-prompt.md
        if edit_section:
            edit_actions = edit_section.group(1)
            allowed_patterns = re.findall(r'"(\.devflow/execution/runs/[^"]+)"', edit_actions)
            for pattern in allowed_patterns:
                if "execution-context.json" not in pattern and "execution-prompt.md" not in pattern:
                    errors.append(f"context-builder: unauthorized edit pattern: {pattern}")

        # 6. body must state it is a subagent (not primary)
        if "eres un subagente" not in body.lower() and "subagente" not in body.lower()[:200]:
            errors.append("context-builder: body must declare it is a subagent")

bntc = root / "opencode/commands/build-next-task-context.md"
if bntc.exists():
    text = bntc.read_text(encoding="utf-8")
    match = frontmatter_re.match(text)
    if match:
        body = text[match.end():]
        # Must not contain instructions to execute or simulate prepare-task-run
        exec_refs = re.findall(r"(?:execute|run|exec|simulate|invoke|delegate\s+to)\s+(?:`[^`]*)?prepare\-task\-run", body, re.IGNORECASE)
        for ref in exec_refs:
            errors.append(f"build-next-task-context: must not instruct to execute prepare-task-run (found: {ref.strip()})")
        # Must not reference prepare-task-run.mjs as something to run
        if re.search(r"prepare-task-run\.mjs", body):
            errors.append("build-next-task-context: must not reference prepare-task-run.mjs as an executable")

if errors:
    print("Validation failed:")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("Validation passed")
PY
