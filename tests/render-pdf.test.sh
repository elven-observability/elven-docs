#!/usr/bin/env bash
#
# render-pdf.test.sh — smoke test de geração de PDF.
#
# Renderiza 2 fixtures (1 PS report theme=client, 1 doc técnico theme=internal)
# e verifica:
#   - PDF foi criado
#   - Tamanho > 1 KB (não está vazio)
#   - Primeiros bytes são "%PDF-" (assinatura PDF válida)
#
# Exit:
#   0  ambos os PDFs OK
#   1  pelo menos 1 falhou
#   2  pré-requisitos ausentes

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RENDER="${ROOT_DIR}/skill/scripts/render-pdf.js"
FIXTURES="${ROOT_DIR}/tests/fixtures"
TMPDIR_LOCAL="$(mktemp -d /tmp/elven-pdf-test.XXXXXX)"

cleanup() { rm -rf "$TMPDIR_LOCAL"; }
trap cleanup EXIT

if [ ! -f "$RENDER" ]; then
  echo "ERRO: $RENDER não encontrado." >&2
  exit 2
fi

if [ ! -d "${ROOT_DIR}/node_modules/puppeteer" ]; then
  echo "ERRO: puppeteer não instalado. Rode 'npm install' no diretório do skill." >&2
  exit 2
fi

if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; RESET=""
fi

fail_count=0

test_one() {
  local fixture="$1"
  local expected_theme="$2"
  local out="$TMPDIR_LOCAL/$(basename "$fixture" .md).pdf"

  echo "Renderizando $(basename "$fixture") (theme=$expected_theme)..."
  if ! node "$RENDER" "$fixture" --out "$out" --theme "$expected_theme" >/dev/null 2>&1; then
    echo "  ${RED}✗${RESET} render falhou"
    fail_count=$((fail_count + 1))
    return
  fi

  if [ ! -f "$out" ]; then
    echo "  ${RED}✗${RESET} arquivo PDF não foi criado em $out"
    fail_count=$((fail_count + 1))
    return
  fi

  local size
  size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out" 2>/dev/null)
  if [ -z "$size" ] || [ "$size" -lt 1024 ]; then
    echo "  ${RED}✗${RESET} PDF muito pequeno (${size} bytes)"
    fail_count=$((fail_count + 1))
    return
  fi

  local magic
  magic=$(head -c 5 "$out")
  if [ "$magic" != "%PDF-" ]; then
    echo "  ${RED}✗${RESET} arquivo gerado não tem assinatura PDF (head=$magic)"
    fail_count=$((fail_count + 1))
    return
  fi

  echo "  ${GREEN}✓${RESET} OK (${size} bytes)"
}

test_one "$FIXTURES/pass-ps-incident-report.md" "client"
test_one "$FIXTURES/pass-language-guide.md" "internal"
test_one "$FIXTURES/pass-mermaid-and-image.md" "internal"

# Bundle mode (offline Mermaid)
test_one_bundle() {
  local fixture="$1"
  local out="$TMPDIR_LOCAL/$(basename "$fixture" .md)-bundle.pdf"

  echo "Renderizando $(basename "$fixture") (mermaid=bundle)..."
  if ! node "$RENDER" "$fixture" --out "$out" --mermaid bundle >/dev/null 2>&1; then
    echo "  ${RED}✗${RESET} render falhou (bundle mode)"
    fail_count=$((fail_count + 1))
    return
  fi
  if [ ! -f "$out" ]; then
    echo "  ${RED}✗${RESET} PDF não criado (bundle mode)"
    fail_count=$((fail_count + 1))
    return
  fi
  local magic
  magic=$(head -c 5 "$out")
  if [ "$magic" != "%PDF-" ]; then
    echo "  ${RED}✗${RESET} assinatura PDF inválida (bundle mode)"
    fail_count=$((fail_count + 1))
    return
  fi
  echo "  ${GREEN}✓${RESET} OK (bundle mode)"
}

test_one_bundle "$FIXTURES/pass-mermaid-and-image.md"

echo
if [ $fail_count -gt 0 ]; then
  echo "${RED}${fail_count} falha(s) no teste de PDF.${RESET}"
  exit 1
fi
echo "${GREEN}Todos os PDFs renderizados OK.${RESET}"
exit 0
