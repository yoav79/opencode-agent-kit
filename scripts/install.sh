#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
SOURCE_DIR="$REPO_ROOT/opencode"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
DRY_RUN=0
FORCE=0
WITH_GLOBAL_RULES=0

usage() {
  cat <<USAGE
Usage: ./scripts/install.sh [options]

Options:
  --config-dir PATH       OpenCode config directory
  --dry-run               Show changes without writing
  --force                 Replace conflicting files or symlinks
  --with-global-rules     Install AGENTS.md and shared rules
  -h, --help              Show this help
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
    --force)
      FORCE=1
      shift
      ;;
    --with-global-rules)
      WITH_GLOBAL_RULES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    printf '[dry-run]'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

link_item() {
  local source=$1
  local destination=$2

  if [ -L "$destination" ]; then
    local current
    current=$(readlink "$destination")
    if [ "$current" = "$source" ]; then
      echo "Already installed: $destination"
      return
    fi
  fi

  if [ -e "$destination" ] || [ -L "$destination" ]; then
    if [ "$FORCE" -ne 1 ]; then
      echo "Conflict: $destination" >&2
      echo "Review it or rerun with --force." >&2
      exit 1
    fi
    if [ -d "$destination" ] && [ ! -L "$destination" ]; then
      echo "Refusing to remove a real directory: $destination" >&2
      exit 1
    fi
    run rm -f "$destination"
  fi

  run mkdir -p "$(dirname "$destination")"
  run ln -s "$source" "$destination"
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "Would install: $destination"
  else
    echo "Installed: $destination"
  fi
}

install_files_from_dir() {
  local source_dir=$1
  local destination_dir=$2
  local source

  run mkdir -p "$destination_dir"
  while IFS= read -r source; do
    link_item "$source" "$destination_dir/$(basename "$source")"
  done < <(find "$source_dir" -mindepth 1 -maxdepth 1 -type f -print | sort)
}

install_directories_from_dir() {
  local source_dir=$1
  local destination_dir=$2
  local source

  run mkdir -p "$destination_dir"
  while IFS= read -r source; do
    link_item "$source" "$destination_dir/$(basename "$source")"
  done < <(find "$source_dir" -mindepth 1 -maxdepth 1 -type d -print | sort)
}

install_files_from_dir "$SOURCE_DIR/agents" "$CONFIG_DIR/agents"
install_directories_from_dir "$SOURCE_DIR/skills" "$CONFIG_DIR/skills"
install_files_from_dir "$SOURCE_DIR/commands" "$CONFIG_DIR/commands"

REPO_TEMPLATES="$REPO_ROOT/templates"
if [ -d "$REPO_TEMPLATES" ]; then
  install_directories_from_dir "$REPO_TEMPLATES" "$CONFIG_DIR/templates"
fi

if [ "$WITH_GLOBAL_RULES" -eq 1 ]; then
  link_item "$SOURCE_DIR/AGENTS.md" "$CONFIG_DIR/AGENTS.md"
  link_item "$SOURCE_DIR/rules" "$CONFIG_DIR/rules"
fi

cat <<EOF_SUMMARY

Installation complete.
Config directory: $CONFIG_DIR

Verify with:
  opencode agent list
EOF_SUMMARY
