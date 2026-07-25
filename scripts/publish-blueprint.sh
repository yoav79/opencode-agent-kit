#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEMPLATES_DIR="$REPO_ROOT/templates"
VALIDATOR="$TEMPLATES_DIR/software-architect/tools/validate-blueprint.mjs"
DOCS_SOURCE_DIR=".devflow/software-architect/docs"
DECISIONS_SOURCE_DIR=".devflow/software-architect/decisions"
PUBLISH_DIR="docs/software-architect"
DRY_RUN=0
FORCE=0

usage() {
  cat <<USAGE
Usage: ./scripts/publish-blueprint.sh [options] PROJECT_ROOT

Publishes the completed Software Blueprint documents to
<PROJECT_ROOT>/docs/software-architect/.

The blueprint must pass all deterministic validations (14 phases approved)
before publishing. Use --force to skip validation.

Options:
  --dry-run       Show what would be published without writing
  --force         Publish without running the validator
  -h, --help      Show this help
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

if [ "$#" -lt 1 ]; then
  echo "Error: PROJECT_ROOT is required." >&2
  usage >&2
  exit 2
fi

PROJECT_ROOT=$(cd "$1" && pwd)
BLUEPRINT_DIR="$PROJECT_ROOT/.devflow/software-architect"
DOCS_SOURCE="$PROJECT_ROOT/$DOCS_SOURCE_DIR"
DECISIONS_SOURCE="$PROJECT_ROOT/$DECISIONS_SOURCE_DIR"
PUBLISH_TARGET="$PROJECT_ROOT/$PUBLISH_DIR"
PUBLISH_DECISIONS="$PUBLISH_TARGET/decisions"

if [ ! -d "$BLUEPRINT_DIR" ]; then
  echo "Error: No existe .devflow/software-architect/ en $PROJECT_ROOT" >&2
  exit 1
fi

if [ ! -f "$BLUEPRINT_DIR/project-state.json" ]; then
  echo "Error: No existe project-state.json en .devflow/software-architect/" >&2
  exit 1
fi

# --- Validation gate ---

if [ "$FORCE" -ne 1 ]; then
  set +e
  node "$VALIDATOR" --root "$PROJECT_ROOT" --quiet 2>/dev/null
  VALIDATOR_EXIT=$?
  set -e

  if [ "$VALIDATOR_EXIT" -ne 0 ]; then
    echo "Blueprint no está listo. Ejecuta el validador para ver los errores:"
    echo "  node $VALIDATOR --root \"$PROJECT_ROOT\""
    exit 1
  fi
fi

# --- Collect files to publish ---

if [ ! -d "$DOCS_SOURCE" ]; then
  echo "Error: No existe $DOCS_SOURCE_DIR/ en el proyecto." >&2
  exit 1
fi

DOC_FILES=()
while IFS= read -r -d '' file; do
  DOC_FILES+=("$file")
done < <(find "$DOCS_SOURCE" -maxdepth 1 -name '*.md' -print0 | sort -z)

if [ ${#DOC_FILES[@]} -eq 0 ]; then
  echo "Error: No se encontraron documentos .md en $DOCS_SOURCE_DIR/." >&2
  exit 1
fi

DECISION_FILES=()
if [ -d "$DECISIONS_SOURCE" ]; then
  while IFS= read -r -d '' file; do
    DECISION_FILES+=("$file")
  done < <(find "$DECISIONS_SOURCE" -maxdepth 1 -name '*.md' -print0 | sort -z)
fi

# --- Publish ---

if [ "$DRY_RUN" -eq 1 ]; then
  echo "[dry-run] Se publicarían ${#DOC_FILES[@]} documentos en $PUBLISH_DIR/:"
  for f in "${DOC_FILES[@]}"; do
    echo "  $PUBLISH_DIR/$(basename "$f")"
  done
  if [ ${#DECISION_FILES[@]} -gt 0 ]; then
    echo ""
    echo "[dry-run] Se publicarían ${#DECISION_FILES[@]} decisiones en $PUBLISH_DIR/decisions/:"
    for f in "${DECISION_FILES[@]}"; do
      echo "  $PUBLISH_DIR/decisions/$(basename "$f")"
    done
  fi
  exit 0
fi

mkdir -p "$PUBLISH_TARGET"

for f in "${DOC_FILES[@]}"; do
  cp -f "$f" "$PUBLISH_TARGET/$(basename "$f")"
done

echo "Publicados ${#DOC_FILES[@]} documentos en $PUBLISH_DIR/"

if [ ${#DECISION_FILES[@]} -gt 0 ]; then
  mkdir -p "$PUBLISH_DECISIONS"
  for f in "${DECISION_FILES[@]}"; do
    cp -f "$f" "$PUBLISH_DECISIONS/$(basename "$f")"
  done
  echo "Publicadas ${#DECISION_FILES[@]} decisiones en $PUBLISH_DIR/decisions/"
fi

echo ""
echo "Archivos publicados:"
for f in "${DOC_FILES[@]}"; do
  echo "  $PUBLISH_DIR/$(basename "$f")"
done
for f in "${DECISION_FILES[@]}"; do
  echo "  $PUBLISH_DIR/decisions/$(basename "$f")"
done
