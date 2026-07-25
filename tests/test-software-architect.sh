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

echo "=== Software Architect End-to-End Tests ==="
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
echo "--- Fixture Structure ---"
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
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
