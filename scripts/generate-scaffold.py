#!/usr/bin/env python3
"""
Genera o actualiza scaffold.json para un agente del repositorio.

Uso:
    python3 scripts/generate-scaffold.py AGENT_NAME [--force]

El script:
1. Busca el agente en opencode/agents/<name>.md
2. Analiza su frontmatter (permisos, bash patterns)
3. Busca comandos asociados en opencode/commands/
4. Escanea templates/<name>/ para archivos disponibles
5. Infiere el nombre del directorio scaffold desde project-state.json
6. Genera o actualiza templates/<name>/scaffold.json
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def parse_frontmatter(text: str) -> dict | None:
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


def parse_bash_permissions(frontmatter: dict) -> list[str]:
    """Extrae archivos referenciados en permisos bash del agente."""
    lines = []
    in_bash = False
    for line in json.dumps(frontmatter).splitlines():
        if '"bash"' in line:
            in_bash = True
        if in_bash:
            lines.append(line)
            if line.strip().startswith("}") and len(lines) > 1:
                break

    text = "\n".join(lines)
    files = []
    for m in re.finditer(r'"cp -n [^"]*? ([^\s"]+)"', text):
        dest = m.group(1)
        fname = dest.rsplit("/", 1)[-1]
        if fname not in files:
            files.append(fname)
    for m in re.finditer(r'"cp -n [^"]*? ([^\s"]+/[^"]*)"', text):
        dest = m.group(1)
        parts = dest.split("/")
        if len(parts) >= 2:
            rel = "/".join(parts[-2:])
            if rel not in files:
                files.append(rel)
    return files


def find_command_for_agent(agent_name: str) -> str:
    """Busca el comando que referencia este agente."""
    commands_dir = REPO_ROOT / "opencode" / "commands"
    if not commands_dir.exists():
        return ""
    for cmd_file in sorted(commands_dir.glob("*.md")):
        text = cmd_file.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        if fm and fm.get("agent") == agent_name:
            return cmd_file.stem
    return ""


def infer_directory_name(agent_dir: Path) -> str:
    """Infiere el nombre del directorio scaffold desde project-state.json o convenciones."""
    state_file = agent_dir / "project-state.json"
    if state_file.exists():
        try:
            data = json.loads(state_file.read_text(encoding="utf-8"))
            if "project" in data and "name" in data["project"]:
                pass
            if "workflow" in data and "phase" in data["workflow"]:
                pass
        except Exception:
            pass

    scaffolds = {
        "software-architect": "software-design",
        "task-planner": "task-planning",
    }
    agent_name = agent_dir.name
    if agent_name in scaffolds:
        return scaffolds[agent_name]

    return agent_name.replace("-", "_")


def scan_templates(agent_dir: Path) -> dict:
    """Escanea el directorio de templates y clasifica archivos."""
    files = []
    dirs = []
    tool_files = []

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

    return {"files": files, "dirs": dirs, "tool_files": tool_files}


def infer_dirs_from_agent(agent_file: Path, directory: str) -> list[str]:
    """Infiere directorios scaffold desde permisos bash del agente (patrones mkdir)."""
    text = agent_file.read_text(encoding="utf-8")
    dirs = []
    for m in re.finditer(r'"mkdir -p ([^"]+)"', text):
        mkdir_args = m.group(1)
        for part in mkdir_args.split():
            if "/" not in part and part != "-p" and part != directory:
                if part not in dirs:
                    dirs.append(part)
    return dirs


def infer_dirs_from_state(agent_dir: Path, directory: str) -> list[str]:
    """Infiere directorios scaffold desde las rutas en project-state.json."""
    state_file = agent_dir / "project-state.json"
    if not state_file.exists():
        return []
    try:
        data = json.loads(state_file.read_text(encoding="utf-8"))
    except Exception:
        return []

    dirs = set()
    for key, val in data.get("documents", {}).items():
        path = val.get("path", "")
        if "/" in path:
            parts = path.split("/")
            if len(parts) >= 3:
                dirs.add(parts[1])

    for key, val in data.get("artifacts", {}).items():
        path = val.get("path", "")
        if "/" in path:
            parts = path.split("/")
            if len(parts) == 2:
                second = parts[1]
                if "." not in second:
                    dirs.add(second)
            elif len(parts) >= 3:
                dirs.add(parts[1])

    if "docs" in dirs:
        for d in ["drafts", "decisions", "archive"]:
            dirs.add(d)

    dirs.discard(directory)

    standard_dirs = ["docs", "drafts", "decisions", "archive", "epics", "tasks", "tools"]
    result = [d for d in standard_dirs if d in dirs]
    for d in sorted(dirs):
        if d not in result:
            result.append(d)
    return result


def build_scaffold(agent_name: str) -> dict:
    """Construye el scaffold.json completo para un agente."""
    agent_dir = REPO_ROOT / "templates" / agent_name
    agent_file = REPO_ROOT / "opencode" / "agents" / f"{agent_name}.md"

    if not agent_dir.exists():
        print(f"Error: No templates directory for agent '{agent_name}'", file=sys.stderr)
        sys.exit(1)

    if not agent_file.exists():
        print(f"Error: Agent file not found: opencode/agents/{agent_name}.md", file=sys.stderr)
        sys.exit(1)

    agent_text = agent_file.read_text(encoding="utf-8")
    frontmatter = parse_frontmatter(agent_text)

    directory = infer_directory_name(agent_dir)
    command = find_command_for_agent(agent_name)
    command_name = f"/{command}" if command else ""

    scanned = scan_templates(agent_dir)
    dirs_from_agent = infer_dirs_from_agent(agent_file, directory)
    dirs_from_state = infer_dirs_from_state(agent_dir, directory)

    all_dirs = []
    for d in dirs_from_agent + dirs_from_state:
        if d not in all_dirs:
            all_dirs.append(d)

    scaffold = {
        "directory": directory,
        "files": scanned["files"],
        "dirs": scanned["dirs"] if scanned["dirs"] else all_dirs,
    }

    if scanned["tool_files"]:
        scaffold["toolFiles"] = scanned["tool_files"]

    if command_name:
        scaffold["command"] = command_name

    state_file = agent_dir / "project-state.json"
    if state_file.exists():
        try:
            data = json.loads(state_file.read_text(encoding="utf-8"))
            if "phases" in data:
                scaffold["phases"] = list(data["phases"].keys())
        except Exception:
            pass

    if frontmatter:
        scaffold["agent"] = {
            "description": frontmatter.get("description", ""),
            "mode": frontmatter.get("mode", ""),
            "temperature": frontmatter.get("temperature", ""),
        }

    return scaffold


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/generate-scaffold.py AGENT_NAME [--force]")
        print()
        print("Agentes disponibles:")
        templates_dir = REPO_ROOT / "templates"
        if templates_dir.exists():
            for d in sorted(templates_dir.iterdir()):
                if d.is_dir() and (d / "project-state.json").exists():
                    print(f"  {d.name}")
        sys.exit(1)

    agent_name = sys.argv[1]
    force = "--force" in sys.argv

    scaffold_file = REPO_ROOT / "templates" / agent_name / "scaffold.json"
    existing_agents_md = ""
    if scaffold_file.exists():
        try:
            existing = json.loads(scaffold_file.read_text(encoding="utf-8"))
            existing_agents_md = existing.get("agentsMd", "")
        except Exception:
            pass

    scaffold = build_scaffold(agent_name)

    if existing_agents_md and "agentsMd" not in scaffold:
        scaffold["agentsMd"] = existing_agents_md

    if scaffold_file.exists() and not force:
        existing = json.loads(scaffold_file.read_text(encoding="utf-8"))
        if existing == scaffold:
            print(f"scaffold.json is already up to date for '{agent_name}'")
            return
        print(f"Updating scaffold.json for '{agent_name}'...")
        print()
        print("Changes:")
        for key in set(list(existing.keys()) + list(scaffold.keys())):
            old = existing.get(key)
            new = scaffold.get(key)
            if old != new:
                print(f"  {key}:")
                print(f"    - {json.dumps(old, ensure_ascii=False)}")
                print(f"    + {json.dumps(new, ensure_ascii=False)}")
    else:
        print(f"Creating scaffold.json for '{agent_name}'...")

    scaffold_file.write_text(
        json.dumps(scaffold, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print()
    print(f"Written: {scaffold_file.relative_to(REPO_ROOT)}")
    print(f"  directory: {scaffold['directory']}")
    print(f"  files: {len(scaffold['files'])}")
    print(f"  dirs: {len(scaffold['dirs'])}")
    if scaffold.get("toolFiles"):
        print(f"  toolFiles: {len(scaffold['toolFiles'])}")
    if scaffold.get("command"):
        print(f"  command: {scaffold['command']}")


if __name__ == "__main__":
    main()
