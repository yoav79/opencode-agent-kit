#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
DRY_RUN=0

usage() {
  cat <<USAGE
Usage: ./scripts/uninstall.sh [options]

Options:
  --config-dir PATH   OpenCode config directory
  --dry-run           Show changes without writing
  -h, --help          Show this help
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --config-dir)
      [ "$#" -ge 2 ] || { echo "Missing value for --config-dir" >&2; exit 2; }
      CONFIG_DIR=$2
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

remove_managed_link() {
  local path=$1
  [ -L "$path" ] || return 0

  local target
  target=$(readlink "$path")
  case "$target" in
    "$REPO_ROOT"/*)
      if [ "$DRY_RUN" -eq 1 ]; then
        echo "[dry-run] Would remove: $path"
      else
        rm -f "$path"
        echo "Removed: $path"
      fi
      ;;
  esac
}

for path in \
  "$CONFIG_DIR/agents/software-architect.md" \
  "$CONFIG_DIR/agents/task-planner.md" \
  "$CONFIG_DIR/commands/init-software-architect.md" \
  "$CONFIG_DIR/commands/init-task-planner.md" \
  "$CONFIG_DIR/templates/software-architect" \
  "$CONFIG_DIR/templates/task-planner" \
  "$CONFIG_DIR/AGENTS.md" \
  "$CONFIG_DIR/rules"
do
  remove_managed_link "$path"
done
