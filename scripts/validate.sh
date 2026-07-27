#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

python3 - "$REPO_ROOT" <<'PY'
import json
import os
import posixpath
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
    "opencode/agents/next-task.md",
    "opencode/agents/context-builder.md",
    "opencode/commands/init-software-architect.md",
    "opencode/commands/compile-blueprint.md",
    "opencode/commands/review-consistency.md",
    "opencode/commands/init-task-planner.md",
    "opencode/commands/init-execution.md",
    "opencode/commands/init-next-task.md",
    "opencode/commands/select-next-task.md",
    "opencode/commands/prepare-task-run.md",
    "opencode/commands/build-task-context.md",
    "opencode/commands/build-next-task-context.md",
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
    "templates/shared/scaffold.json",
    "templates/shared/tools/devflow-runtime-helpers.mjs",
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
    "templates/next-task/README.md",
    "templates/next-task/selection.json",
    "templates/next-task/task-selection.schema.json",
    "templates/next-task/scaffold.json",
    "templates/next-task/tools/select-next-task.mjs",
    "templates/next-task/tools/validate-next-task.mjs",
    "templates/execution/README.md",
    "templates/execution/execution-state.json",
    "templates/execution/execution-state.schema.json",
    "templates/execution/transition-journal.schema.json",
    "templates/execution/scaffold.json",
    "templates/execution/tools/execution-contract-helpers.mjs",
    "templates/execution/tools/execution-transition-engine.mjs",
    "templates/execution/tools/migrate-execution-state-v1-to-v2.mjs",
    "templates/execution/tools/prepare-task-run.mjs",
    "templates/execution/tools/touch-execution-state.mjs",
    "templates/context-builder/tools/inspect-repository-context.mjs",
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
section_re = re.compile(r"^(#{2,3} .+?)\n(.*?)(?=^#{2,3} |\Z)", re.MULTILINE | re.DOTALL)


def normalize_directory(directory):
    return directory.rstrip("/")


def installed_path(directory, relative):
    return f"{normalize_directory(directory)}/{relative}"


def extract_section_paths(doc_path, heading):
    text = doc_path.read_text(encoding="utf-8")
    for matched_heading, body in section_re.findall(text):
        if matched_heading == heading:
            return {path for path in re.findall(r"^- `([^`]+)`", body, re.MULTILINE)}
    errors.append(f"Missing section '{heading}' in {doc_path.relative_to(root)}")
    return None


def compare_doc_paths(doc_relative, heading, expected_paths):
    doc_path = root / doc_relative
    actual_paths = extract_section_paths(doc_path, heading)
    if actual_paths is None:
        return
    if actual_paths != expected_paths:
        errors.append(
            f"{doc_relative}: section '{heading}' does not match expected paths. "
            f"expected={sorted(expected_paths)} actual={sorted(actual_paths)}"
        )


def extract_imports(text):
    imports = []
    for from_match, bare_match in re.findall(r"from\s+['\"]([^'\"]+)['\"]|import\s+['\"]([^'\"]+)['\"]", text):
        imports.append(from_match or bare_match)
    return imports


scaffolds = {}
installed_files_by_directory = {}

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
        scaffolds[agent_dir.name] = scaffold
        if "directory" not in scaffold:
            errors.append(f"scaffold.json missing 'directory': {scaffold_file.relative_to(root)}")
        if "files" not in scaffold:
            errors.append(f"scaffold.json missing 'files': {scaffold_file.relative_to(root)}")
        directory = scaffold.get("directory")
        if isinstance(directory, str):
            installed_files_by_directory.setdefault(normalize_directory(directory), set()).update(
                installed_path(directory, relative)
                for relative in scaffold.get("files", [])
            )
        for f in scaffold.get("files", []):
            if not (agent_dir / f).exists():
                errors.append(f"scaffold.json references missing file {f}: {scaffold_file.relative_to(root)}")
    except Exception as exc:
        errors.append(f"Error reading {scaffold_file.relative_to(root)}: {exc}")

execution_package_files = set()
for pkg_name in ("next-task", "execution", "context-builder"):
    pkg_path = root / "packages" / pkg_name / "manifest.json"
    if not pkg_path.exists():
        errors.append(f"Package manifest missing: packages/{pkg_name}/manifest.json")
        continue
    try:
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
        for f in pkg.get("files", []):
            execution_package_files.add(f["target"])
    except Exception as exc:
        errors.append(f"Error reading {pkg_path.relative_to(root)}: {exc}")

# Remove README.md from the set if present (seed file, not runtime)
execution_runtime_paths = {p for p in execution_package_files if not p.endswith("README.md")}

all_installed_paths = set()
for paths in installed_files_by_directory.values():
    all_installed_paths.update(paths)

for tool_path in sorted(root.glob("templates/*/tools/*.mjs")):
    if tool_path.name.endswith(".test.mjs"):
        continue
    template_name = tool_path.relative_to(root / "templates").parts[0]
    scaffold = scaffolds.get(template_name)
    if not scaffold or "directory" not in scaffold:
        continue
    directory = normalize_directory(scaffold["directory"])
    source_relative = tool_path.relative_to(root / "templates" / template_name).as_posix()
    installed_source = installed_path(directory, source_relative)
    for specifier in extract_imports(tool_path.read_text(encoding="utf-8")):
        if not specifier.startswith("."):
            continue
        resolved = posixpath.normpath(posixpath.join(posixpath.dirname(installed_source), specifier))
        if resolved not in all_installed_paths:
            errors.append(
                f"Orphan runtime import in {tool_path.relative_to(root)}: {specifier} -> {resolved}"
            )

sa_doc_templates = list((root / "templates/software-architect/doc-templates").glob("*.md"))
main_templates = [t for t in sa_doc_templates if t.name not in ("SKILL.md",)]
if len(main_templates) != 14:
    errors.append(f"software-architect doc-templates has {len(main_templates)} files, expected 14")

# --- Test coverage validation ---

known_test_targets = {
    "test-next-task-tools": sorted(root.glob("templates/next-task/tools/*.test.mjs")),
    "test-task-planner-tools": sorted(root.glob("templates/task-planner/tools/*.test.mjs")),
    "test-execution-tools": [
        root / "templates/execution/tools/prepare-task-run.test.mjs",
        root / "templates/execution/tools/execution-transition-engine.test.mjs",
        root / "templates/execution/tools/execution-migration.test.mjs",
    ],
    "test-agent-contracts": [
        root / "templates/execution/tools/contractual-tests.test.mjs",
        root / "templates/execution/tools/build-next-task-context.test.mjs",
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

# --- DevFlow Installer validation ---

packages_dir = root / "packages"
expected_packages = {
    "shared-runtime", "software-architect", "task-planner",
    "next-task", "execution", "context-builder",
    "planning-stack", "execution-stack", "all",
}

for pkg_name in sorted(expected_packages):
    manifest_path = packages_dir / pkg_name / "manifest.json"
    if not manifest_path.exists():
        errors.append(f"Package missing manifest: packages/{pkg_name}/manifest.json")
        continue
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid manifest {manifest_path.relative_to(root)}: {exc}")
        continue

    if manifest.get("schemaVersion") != 1:
        errors.append(f"{manifest_path.relative_to(root)}: schemaVersion must be 1")
    if manifest.get("name") != pkg_name:
        errors.append(f"{manifest_path.relative_to(root)}: name must match directory name: {pkg_name}")
    if "version" not in manifest:
        errors.append(f"{manifest_path.relative_to(root)}: missing version")

    # Validate dependencies exist
    for dep in manifest.get("dependencies", []):
        if dep not in expected_packages:
            errors.append(f"{manifest_path.relative_to(root)}: unknown dependency: {dep}")
        dep_path = packages_dir / dep / "manifest.json"
        if not dep_path.exists():
            errors.append(f"{manifest_path.relative_to(root)}: dependency manifest not found: {dep}")

    # Validate packages referenced exist (metapackages)
    for sub in manifest.get("packages", []):
        if sub not in expected_packages:
            errors.append(f"{manifest_path.relative_to(root)}: unknown sub-package: {sub}")

    # Validate files
    seen_targets = {}
    for f in manifest.get("files", []):
        if "source" not in f or "target" not in f:
            errors.append(f"{manifest_path.relative_to(root)}: file entry missing source or target: {f}")
            continue
        source = f["source"]
        target = f["target"]

        # Source must exist
        source_path = root / source
        if not source_path.exists():
            errors.append(f"{manifest_path.relative_to(root)}: source not found: {source}")

        # Target must be relative
        if os.path.isabs(target) or target.startswith("/"):
            errors.append(f"{manifest_path.relative_to(root)}: target must be relative: {target}")

        # No traversal
        normalized = posixpath.normpath(target)
        if normalized.startswith("..") or "/../" in f"/{target}":
            errors.append(f"{manifest_path.relative_to(root)}: target must not contain traversal: {target}")

        # Ownership: no two packages claim the same target
        if target in seen_targets:
            errors.append(f"Ownership conflict: '{target}' claimed by '{seen_targets[target]}' and '{pkg_name}'")
        seen_targets[target] = pkg_name

# Validate metapackage resolution
def resolve_metapackage(name, visited=None, leaf_packages_set=None):
    if leaf_packages_set is None:
        leaf_packages_set = set()
    if visited is None:
        visited = set()
    if name in visited:
        return set()
    visited.add(name)
    manifest_path = packages_dir / name / "manifest.json"
    if not manifest_path.exists():
        return set()
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception:
        return set()
    sub_pkgs = manifest.get("packages", [])
    if sub_pkgs:
        # This is a metapackage - resolve its children
        for sub in sub_pkgs:
            resolve_metapackage(sub, visited, leaf_packages_set)
    else:
        # This is a leaf package
        leaf_packages_set.add(name)
    return leaf_packages_set

planning_set = resolve_metapackage("planning-stack")
planning_expected = {"shared-runtime", "software-architect", "task-planner"}
if planning_set != planning_expected:
    errors.append(f"planning-stack resolves to {planning_set}, expected {planning_expected}")

execution_set = resolve_metapackage("execution-stack")
execution_expected = {"shared-runtime", "next-task", "execution", "context-builder"}
if execution_set != execution_expected:
    errors.append(f"execution-stack resolves to {execution_set}, expected {execution_expected}")

all_set = resolve_metapackage("all")
all_expected = planning_expected | execution_expected
if all_set != all_expected:
    errors.append(f"all resolves to {all_set}, expected {all_expected}")

# Cycle detection (manifest-level)
def has_cycles(name, stack=None, visited=None):
    if stack is None:
        stack = set()
    if visited is None:
        visited = set()
    if name in stack:
        return True
    if name in visited:
        return False
    stack.add(name)
    visited.add(name)
    manifest_path = packages_dir / name / "manifest.json"
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            for dep in manifest.get("dependencies", []):
                if has_cycles(dep, stack, visited):
                    return True
            for sub in manifest.get("packages", []):
                if has_cycles(sub, stack, visited):
                    return True
        except Exception:
            pass
    stack.discard(name)
    return False

for pkg_name in sorted(expected_packages):
    if has_cycles(pkg_name):
        errors.append(f"Dependency cycle detected in package: {pkg_name}")

# Validate legacy init wrappers delegate to devflow CLI
init_wrapper_commands = [
    "init-software-architect",
    "init-task-planner",
    "init-execution",
    "init-next-task",
]
for cmd_name in init_wrapper_commands:
    cmd_path = root / "opencode" / "commands" / f"{cmd_name}.md"
    if not cmd_path.exists():
        errors.append(f"Wrapper command not found: opencode/commands/{cmd_name}.md")
        continue
    text = cmd_path.read_text(encoding="utf-8")
    if "bin/devflow.mjs init" not in text:
        errors.append(f"{cmd_name}.md: must delegate to devflow init CLI (missing 'bin/devflow.mjs init')")
    # No manual install logic
    for forbidden_pattern in ["cp -n", "mkdir -p", "shutil.copy", "create directory", "crea directorio"]:
        if forbidden_pattern in text:
            errors.append(f"{cmd_name}.md: must not contain manual install instructions (found: '{forbidden_pattern}')")

# Validate devflow-init command exists
devflow_init_path = root / "opencode" / "commands" / "devflow-init.md"
if not devflow_init_path.exists():
    errors.append("Missing devflow-init command: opencode/commands/devflow-init.md")
else:
    text = devflow_init_path.read_text(encoding="utf-8")
    if "bin/devflow.mjs init" not in text:
        errors.append("devflow-init.md: must delegate to devflow init CLI")

# Validate agents don't have obsolete init permissions (frontmatter only)
for agent_file in sorted((root / "opencode/agents").glob("*.md")):
    text = agent_file.read_text(encoding="utf-8")
    match = frontmatter_re.match(text)
    if not match:
        continue
    frontmatter = match.group(1)
    # No cp -n for template files (init-related) in frontmatter
    cp_init_pattern = re.compile(r'cp -n.*templates/')
    if cp_init_pattern.search(frontmatter):
        errors.append(f"{agent_file.relative_to(root)}: must not contain cp -n for template installation in permissions")

if errors:
    print("Validation failed:")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("Validation passed")
PY
