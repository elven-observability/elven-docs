#!/usr/bin/env bash
#
# lint.test.sh — testa skill/scripts/lint.sh contra fixtures.
#
# Cada fixture em tests/fixtures/ tem prefixo:
#   pass-*  → esperado: lint exit 0
#   fail-*  → esperado: lint exit 1
#
# Exit:
#   0  todos os fixtures comportam como esperado
#   1  pelo menos 1 fixture comportou diferente do esperado

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LINT="${ROOT_DIR}/skill/scripts/lint.sh"
FIXTURES="${ROOT_DIR}/tests/fixtures"

if [ ! -f "$LINT" ]; then
  echo "ERRO: $LINT não encontrado." >&2
  exit 2
fi

pass_total=0
fail_total=0
unexpected=0

run_fixture() {
  local fixture="$1"
  local expected="$2"  # 0 (pass) ou 1 (fail)
  local label
  label=$(basename "$fixture")

  bash "$LINT" "$fixture" >/dev/null 2>&1
  local actual=$?

  if [ "$actual" = "$expected" ]; then
    echo "  ✓ ${label} (esperado=${expected}, obtido=${actual})"
    if [ "$expected" = "0" ]; then
      pass_total=$((pass_total + 1))
    else
      fail_total=$((fail_total + 1))
    fi
  else
    echo "  ✗ ${label} (esperado=${expected}, obtido=${actual})"
    unexpected=$((unexpected + 1))
  fi
}

echo "Rodando fixtures de pass-*:"
for f in "$FIXTURES"/pass-*.md; do
  [ -f "$f" ] || continue
  run_fixture "$f" 0
done

echo
echo "Rodando fixtures de fail-*:"
for f in "$FIXTURES"/fail-*.md; do
  [ -f "$f" ] || continue
  run_fixture "$f" 1
done

echo
echo "totais: ${pass_total} pass-* OK, ${fail_total} fail-* OK, ${unexpected} comportamento inesperado."

if [ "$unexpected" -gt 0 ]; then
  exit 1
fi
exit 0
