#!/usr/bin/env bash
#
# lint.sh — gate binário do elven-docs-skill (10 itens)
#
# Uso:
#   bash skill/scripts/lint.sh <arquivo.md> [<arquivo.md>...]
#   bash skill/scripts/lint.sh --frontmatter <arquivo.md>   # apenas itens 1-4
#
# Exit:
#   0  todos passam
#   1  pelo menos 1 falha
#   2  uso incorreto

set -uo pipefail

VALID_TYPES="language-instrumentation-guide platform-instrumentation-guide stack-installation-guide frontend-sdk-guide pdtec-spec ps-incident-report ps-load-test-report ps-comparative-report ps-spike-report"
REQUIRED_FRONTMATTER_FIELDS="title slug type audience last_reviewed status owner"

frontmatter_only=0
if [ "${1:-}" = "--frontmatter" ]; then
  frontmatter_only=1
  shift
fi

if [ $# -eq 0 ]; then
  echo "Uso: lint.sh [--frontmatter] <arquivo.md> [<arquivo.md>...]" >&2
  exit 2
fi

# ANSI cores opcionais
if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; RESET=""
fi

fail_count=0
pass_count=0

print_fail() {
  echo "  ${RED}✗${RESET} $1: $2"
  fail_count=$((fail_count + 1))
}
print_pass() {
  pass_count=$((pass_count + 1))
}
print_warn() {
  echo "  ${YELLOW}!${RESET} $1: $2"
}

# Extrai bloco entre primeira e segunda linha "---" (frontmatter YAML)
extract_frontmatter() {
  awk '/^---$/{c++; if (c==1) next; if (c==2) exit} c==1' "$1"
}

# Verifica se o frontmatter contém um campo
fm_has_field() {
  local fm="$1" field="$2"
  printf '%s\n' "$fm" | grep -qE "^${field}:"
}

# Lê valor de um campo (1ª ocorrência; sem suporte a multi-line)
fm_value() {
  local fm="$1" field="$2"
  printf '%s\n' "$fm" | grep -E "^${field}:" | head -1 | sed -E "s/^${field}:[[:space:]]*//; s/^\"(.*)\"$/\1/; s/^'(.*)'$/\1/"
}

lint_file() {
  local file="$1"
  local file_fail_count_before=$fail_count
  echo "${file}"

  # Item 1 — Frontmatter presente (linha 1 == ---, fechamento até linha 30)
  if [ "$(head -1 "$file")" != "---" ]; then
    print_fail "1" "frontmatter ausente (linha 1 deve ser '---')"
  elif ! head -30 "$file" | tail -29 | grep -qE '^---$'; then
    print_fail "1" "frontmatter não fecha em até 30 linhas (esperado segundo '---')"
  else
    print_pass
  fi

  local fm
  fm=$(extract_frontmatter "$file")

  # Item 2 — 6 campos obrigatórios
  local missing_fields=""
  for f in $REQUIRED_FRONTMATTER_FIELDS; do
    if ! fm_has_field "$fm" "$f"; then
      missing_fields="${missing_fields} $f"
    fi
  done
  if [ -n "$missing_fields" ]; then
    print_fail "2" "campos faltando no frontmatter:${missing_fields}"
  else
    print_pass
  fi

  # Item 3 — type é enum válido
  local type_value
  type_value=$(fm_value "$fm" "type")
  if [ -z "$type_value" ]; then
    print_fail "3" "campo 'type' vazio ou ausente"
  else
    local found=0
    for t in $VALID_TYPES; do
      if [ "$type_value" = "$t" ]; then found=1; break; fi
    done
    if [ "$found" -eq 0 ]; then
      print_fail "3" "type inválido: '${type_value}' (válidos: ${VALID_TYPES})"
    else
      print_pass
    fi
  fi

  # Item 4 — slug == filename (sem .md)
  local slug_value fname
  slug_value=$(fm_value "$fm" "slug")
  fname=$(basename "$file" .md)
  if [ -z "$slug_value" ]; then
    print_fail "4" "campo 'slug' ausente"
  elif [ "$slug_value" != "$fname" ]; then
    print_fail "4" "slug ('${slug_value}') != filename ('${fname}')"
  else
    print_pass
  fi

  # last_reviewed warning (não falha; informa)
  local last_reviewed
  last_reviewed=$(fm_value "$fm" "last_reviewed")
  if [ -n "$last_reviewed" ]; then
    if date -j -f "%Y-%m-%d" "$last_reviewed" +%s >/dev/null 2>&1; then
      local lr_epoch now_epoch days
      lr_epoch=$(date -j -f "%Y-%m-%d" "$last_reviewed" +%s 2>/dev/null || echo 0)
      now_epoch=$(date +%s)
      days=$(( (now_epoch - lr_epoch) / 86400 ))
      if [ "$days" -gt 180 ]; then
        print_warn "last_reviewed" "doc revisado há ${days} dias (>180); considere atualizar"
      fi
    elif date -d "$last_reviewed" +%s >/dev/null 2>&1; then
      local lr_epoch now_epoch days
      lr_epoch=$(date -d "$last_reviewed" +%s)
      now_epoch=$(date +%s)
      days=$(( (now_epoch - lr_epoch) / 86400 ))
      if [ "$days" -gt 180 ]; then
        print_warn "last_reviewed" "doc revisado há ${days} dias (>180); considere atualizar"
      fi
    fi
  fi

  if [ $frontmatter_only -eq 1 ]; then
    return
  fi

  # Item 5 — exatamente 1 H1 (ignorar headings dentro de code fences)
  local h1_count
  h1_count=$(awk '
    /^```/ { in_fence = 1 - in_fence; next }
    in_fence == 0 && /^# [^#]/ { count++ }
    END { print count + 0 }
  ' "$file")
  if [ "$h1_count" -ne 1 ]; then
    print_fail "5" "esperado exatamente 1 H1 (fora de code blocks), encontrado ${h1_count}"
  else
    print_pass
  fi

  # Item 6 — TOC canônico por type
  case "$type_value" in
    frontend-sdk-guide)
      if ! grep -qE '^## Índice$' "$file"; then
        print_fail "6" "frontend-sdk-guide deve ter '## Índice'"
      else
        print_pass
      fi
      ;;
    pdtec-spec)
      # pode dispensar
      print_pass
      ;;
    ps-incident-report|ps-load-test-report|ps-comparative-report|ps-spike-report)
      # PS reports usam Sumário; verificar que existe "Sumário executivo"
      # como parte da ossatura (não TOC), e que TOC '## Sumário' está presente.
      if ! grep -qE '^## Sumário$' "$file"; then
        print_fail "6" "PS report deve ter '## Sumário' (TOC)"
      elif ! grep -qE '^## Sumário executivo$' "$file"; then
        print_fail "6" "PS report deve ter '## Sumário executivo' (overview pra stakeholder)"
      else
        print_pass
      fi
      ;;
    *)
      if ! grep -qE '^## Sumário$' "$file"; then
        print_fail "6" "type ${type_value} deve ter '## Sumário'"
      else
        print_pass
      fi
      ;;
  esac

  # Item 7 — Quick Start canônico (S maiúsculo, em-dash em variantes)
  # PS reports não têm Quick Start; pulam.
  case "$type_value" in
    ps-incident-report|ps-load-test-report|ps-comparative-report|ps-spike-report)
      print_pass
      ;;
    *)
      local q_fail=0
      if grep -qE '^## Quick start' "$file"; then
        print_fail "7" "encontrado 'Quick start' minúsculo (use 'Quick Start')"
        q_fail=1
      fi
      if grep -qE '^## Quick Start - [^-]' "$file"; then
        print_fail "7" "variante de Quick Start usando hífen simples (use em-dash '—')"
        q_fail=1
      fi
      if [ $q_fail -eq 0 ]; then
        print_pass
      fi
      ;;
  esac

  # Item 8 — toda fence ABERTA tem tag de linguagem
  # State machine: alterna in_fence a cada ``` no início de linha.
  # Só verifica abertura (transição out→in); fechamento é sempre ``` puro.
  local untagged_lines
  untagged_lines=$(awk '
    /^```/ {
      if (in_fence == 0) {
        if ($0 == "```") {
          print NR
        }
        in_fence = 1
      } else {
        in_fence = 0
      }
    }
  ' "$file")
  if [ -n "$untagged_lines" ]; then
    local nlines
    nlines=$(printf '%s\n' "$untagged_lines" | wc -l | tr -d ' ')
    local first_lines
    first_lines=$(printf '%s\n' "$untagged_lines" | head -3 | tr '\n' ',' | sed 's/,$//')
    print_fail "8" "${nlines} fence(s) de abertura sem tag de linguagem (linha(s): ${first_lines}; proibido \`\`\` puro)"
  else
    print_pass
  fi

  # Item 9 — sem emoji (codepoints comuns)
  # Usa LC_ALL=C com Perl regex via grep -P quando disponível.
  if grep -qP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$file" 2>/dev/null; then
    print_fail "9" "emoji detectado (banido por E6 — use texto explícito)"
  elif command -v perl >/dev/null 2>&1; then
    if perl -CSD -ne 'exit 1 if /[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]/' "$file"; then
      print_pass
    else
      print_fail "9" "emoji detectado (banido por E6 — use texto explícito)"
    fi
  else
    # Sem grep -P nem perl — pula com warning
    print_warn "9" "verificação de emoji indisponível (sem grep -P nem perl); item assumido como passa"
    print_pass
  fi

  # Item 10 — callouts tipados só dentro de blockquote
  # Falha se detectar **Atenção:|Importante:|Nota:|Dica:|Cuidado:|Aviso:** em linha que NÃO comece com >
  if grep -nE '^[^>].*\*\*(Atenção|Importante|Nota|Dica|Cuidado|Aviso):' "$file" >/dev/null 2>&1; then
    local lines
    lines=$(grep -nE '^[^>].*\*\*(Atenção|Importante|Nota|Dica|Cuidado|Aviso):' "$file" | head -3 | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
    print_fail "10" "callout bold inline fora de blockquote (linhas ${lines}; use '> **Prefixo:**')"
  else
    print_pass
  fi

  # Resumo do arquivo
  local file_fails=$((fail_count - file_fail_count_before))
  if [ "$file_fails" -eq 0 ]; then
    echo "  ${GREEN}✓ passou${RESET}"
  else
    echo "  ${RED}${file_fails} falha(s)${RESET}"
  fi
}

for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "${RED}arquivo não encontrado: ${f}${RESET}" >&2
    fail_count=$((fail_count + 1))
    continue
  fi
  lint_file "$f"
done

echo
echo "total: ${pass_count} passou, ${fail_count} falhou"

if [ "$fail_count" -gt 0 ]; then
  exit 1
fi
exit 0
