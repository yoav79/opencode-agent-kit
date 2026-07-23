#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEMPLATE_DIR="$REPO_ROOT/templates/software-design-project"
FORCE=0

usage() {
  cat <<USAGE
Usage: ./scripts/create-project.sh [--force] PROJECT_PATH

Creates the software design scaffold inside an existing or new project.
USAGE
}

if [ "${1:-}" = "--force" ]; then
  FORCE=1
  shift
fi

if [ "$#" -ne 1 ]; then
  usage >&2
  exit 2
fi

TARGET=$1
mkdir -p "$TARGET"
TARGET=$(cd "$TARGET" && pwd)

if [ -e "$TARGET/software-design" ] && [ "$FORCE" -ne 1 ]; then
  echo "Refusing to overwrite: $TARGET/software-design" >&2
  echo "Use --force only after reviewing the existing directory." >&2
  exit 1
fi

if [ "$FORCE" -eq 1 ]; then
  rm -rf "$TARGET/software-design"
fi

cp -R "$TEMPLATE_DIR/software-design" "$TARGET/software-design"

if [ ! -e "$TARGET/AGENTS.md" ]; then
  cp "$TEMPLATE_DIR/AGENTS.md" "$TARGET/AGENTS.md"
else
  echo "Preserved existing AGENTS.md"
fi

PROJECT_NAME=$(basename "$TARGET")
REPOSITORY_URL=""
if command -v git >/dev/null 2>&1 && git -C "$TARGET" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPOSITORY_URL=$(git -C "$TARGET" config --get remote.origin.url || true)
fi

python3 - "$TARGET/software-design/project-state.json" "$PROJECT_NAME" "$REPOSITORY_URL" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
name = sys.argv[2]
repository = sys.argv[3] or None

data = json.loads(path.read_text(encoding="utf-8"))
data["project"]["name"] = name
data["project"]["repository"] = repository
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

cat <<EOF_SUMMARY
Created project scaffold:
  $TARGET/software-design

Next:
  cd "$TARGET"
  opencode
  /new-blueprint
EOF_SUMMARY
