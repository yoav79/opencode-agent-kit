#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEMPLATES_DIR="$REPO_ROOT/templates"
FIXTURES_DIR="$SCRIPT_DIR/fixtures/software-architect"
VALIDATOR="$TEMPLATES_DIR/software-architect/tools/validate-blueprint.mjs"
MIGRATOR="$TEMPLATES_DIR/software-architect/tools/migrate-v1-to-v2.mjs"

PASS=0
FAIL=0

test_validator() {
  local name=$1
  local fixture=$2
  local expected_exit=$3
  shift 3

  set +e
  node "$VALIDATOR" --root "$fixture" --templates "$TEMPLATES_DIR/software-architect/doc-templates" --quiet --json 2>/dev/null
  local exit_code=$?
  set -e

  if [ "$exit_code" -eq "$expected_exit" ]; then
    echo "PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $name (expected exit $expected_exit, got $exit_code)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Software Architect Deterministic Tool Tests ==="
echo ""

echo "--- Validator Tests ---"
test_validator "valid-v2 passes" "$FIXTURES_DIR/valid-v2" 0
test_validator "missing-docs fails" "$FIXTURES_DIR/missing-docs" 1
test_validator "blocked-review fails" "$FIXTURES_DIR/blocked-review" 1

echo ""
echo "--- Migration Script Syntax ---"
if node --check "$MIGRATOR" 2>/dev/null; then
  echo "PASS: migration script syntax OK"
  PASS=$((PASS + 1))
else
  echo "FAIL: migration script syntax error"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "--- Migration Policy Exists ---"
if [ -f "$TEMPLATES_DIR/software-architect/migration/v1-to-v2-policy.md" ]; then
  echo "PASS: migration policy exists"
  PASS=$((PASS + 1))
else
  echo "FAIL: migration policy not found"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "--- Fixture Sanity Checks ---"
if [ -d "$FIXTURES_DIR/valid-v2/.devflow/software-architect/docs" ] && \
   [ -f "$FIXTURES_DIR/valid-v2/.devflow/software-architect/docs/SOFTWARE-BLUEPRINT.md" ]; then
  echo "PASS: valid-v2 fixture complete"
  PASS=$((PASS + 1))
else
  echo "FAIL: valid-v2 fixture incomplete"
  FAIL=$((FAIL + 1))
fi

if [ ! -f "$FIXTURES_DIR/missing-docs/.devflow/software-architect/docs/03-application-flow.md" ] && \
   [ -f "$FIXTURES_DIR/missing-docs/.devflow/software-architect/docs/01-discovery.md" ]; then
  echo "PASS: missing-docs fixture correctly incomplete"
  PASS=$((PASS + 1))
else
  echo "FAIL: missing-docs fixture incorrect"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "--- Migration Behavior Tests ---"
V1_FIXTURE="$FIXTURES_DIR/v1-project"
MIG_TEST_DIR=$(mktemp -d)
MIG_CONFIG_HOME=$(mktemp -d)
cp -r "$V1_FIXTURE/." "$MIG_TEST_DIR/"
mkdir -p "$MIG_CONFIG_HOME/opencode"
ln -s "$TEMPLATES_DIR" "$MIG_CONFIG_HOME/opencode/templates"

set +e
(cd "$MIG_TEST_DIR" && XDG_CONFIG_HOME="$MIG_CONFIG_HOME" node "$MIGRATOR" 2>&1)
MIG_EXIT=$?
set -e

if [ "$MIG_EXIT" -eq 0 ]; then
  echo "PASS: migration completed without error"
  PASS=$((PASS + 1))
else
  echo "FAIL: migration failed with exit code $MIG_EXIT"
  FAIL=$((FAIL + 1))
fi

# Verify migrated state
MIG_STATE="$MIG_TEST_DIR/.devflow/software-architect/project-state.json"
SCHEMA_VER=$(python3 -c "import json; print(json.loads(open('$MIG_STATE').read())['schemaVersion'])")
if [ "$SCHEMA_VER" = "2" ]; then
  echo "PASS: migrated schemaVersion is 2"
  PASS=$((PASS + 1))
else
  echo "FAIL: migrated schemaVersion is $SCHEMA_VER, expected 2"
  FAIL=$((FAIL + 1))
fi

PHASE_COUNT=$(python3 -c "import json; print(len(json.loads(open('$MIG_STATE').read())['phases']))")
if [ "$PHASE_COUNT" = "14" ]; then
  echo "PASS: migrated has 14 phases"
  PASS=$((PASS + 1))
else
  echo "FAIL: migrated has $PHASE_COUNT phases, expected 14"
  FAIL=$((FAIL + 1))
fi

DOC_COUNT=$(python3 -c "import json; print(len(json.loads(open('$MIG_STATE').read())['documents']))")
if [ "$DOC_COUNT" = "14" ]; then
  echo "PASS: migrated has 14 documents"
  PASS=$((PASS + 1))
else
  echo "FAIL: migrated has $DOC_COUNT documents, expected 14"
  FAIL=$((FAIL + 1))
fi

HAS_UIUX=$(python3 -c "import json; s=json.loads(open('$MIG_STATE').read()); print('4_uiux_brief' in s['phases'] and '04_uiux_brief' in s['documents'])")
if [ "$HAS_UIUX" = "True" ]; then
  echo "PASS: migrated has uiux_brief phase and document"
  PASS=$((PASS + 1))
else
  echo "FAIL: migrated missing uiux_brief"
  FAIL=$((FAIL + 1))
fi

HAS_TECH_REQ=$(python3 -c "import json; s=json.loads(open('$MIG_STATE').read()); print('11_technical_requirements' in s['phases'] and '11_technical_requirements' in s['documents'])")
if [ "$HAS_TECH_REQ" = "True" ]; then
  echo "PASS: migrated has technical_requirements phase and document"
  PASS=$((PASS + 1))
else
  echo "FAIL: migrated missing technical_requirements"
  FAIL=$((FAIL + 1))
fi

# Verify doc rename: v1 names should not exist, v2 names should
if [ ! -f "$MIG_TEST_DIR/.devflow/software-architect/docs/02-executive-definition.md" ] && \
   [ -f "$MIG_TEST_DIR/.devflow/software-architect/docs/02-product-requirements.md" ]; then
  echo "PASS: docs renamed from v1 to v2 names"
  PASS=$((PASS + 1))
else
  echo "FAIL: docs not properly renamed"
  FAIL=$((FAIL + 1))
fi

rm -rf "$MIG_TEST_DIR"
rm -rf "$MIG_CONFIG_HOME"

echo ""
echo "--- DocKey→PhaseKey Consistency Test ---"
# Create a fixture where phase 2 is approved but doc 02 is missing
CONSISTENCY_DIR=$(mktemp -d)
mkdir -p "$CONSISTENCY_DIR/.devflow/software-architect/docs"
cp "$FIXTURES_DIR/valid-v2/.devflow/software-architect/project-state.json" "$CONSISTENCY_DIR/.devflow/software-architect/project-state.json"
# Remove doc 02 to trigger error
rm -f "$CONSISTENCY_DIR/.devflow/software-architect/docs/02-product-requirements.md" 2>/dev/null || true

# Copy all docs except 02
for f in "$FIXTURES_DIR/valid-v2/.devflow/software-architect/docs/"*.md; do
  base=$(basename "$f")
  if [ "$base" != "02-product-requirements.md" ]; then
    cp "$f" "$CONSISTENCY_DIR/.devflow/software-architect/docs/"
  fi
done

set +e
node "$VALIDATOR" --root "$CONSISTENCY_DIR" --templates "$TEMPLATES_DIR/software-architect/doc-templates" --quiet --json 2>/dev/null
CONSISTENCY_EXIT=$?
set -e

# Should fail because phase 2 is approved but doc missing
if [ "$CONSISTENCY_EXIT" -eq 1 ]; then
  echo "PASS: docKey→phaseKey mapping catches approved phase with missing doc"
  PASS=$((PASS + 1))
else
  echo "FAIL: docKey→phaseKey mapping did not catch approved phase with missing doc (exit $CONSISTENCY_EXIT)"
  FAIL=$((FAIL + 1))
fi

rm -rf "$CONSISTENCY_DIR"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
