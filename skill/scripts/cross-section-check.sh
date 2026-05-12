#!/usr/bin/env bash
#
# cross-section-check.sh — relatório de claims quantitativas em PS reports.
#
# Extrai padrões numéricos que costumam aparecer em múltiplas seções de um
# relatório (Sumário Executivo, Timeline, Análise) e reporta INCONSISTÊNCIAS.
# Não é gate binário — é um REPORT pra revisor humano confirmar antes de
# entregar ao cliente. Quality-gate 6.3 (artifact-contract.md) exige que
# "numbers must match across sections" — este script ajuda a achar drift.
#
# Uso:
#   bash skill/scripts/cross-section-check.sh <arquivo.md> [<arquivo.md>...]
#   # ou via CLI:
#   elven-docs-skill check <arquivo.md>
#
# Exit:
#   0  sempre (é report, não gate)
#   2  uso incorreto

set -uo pipefail

if [ $# -eq 0 ]; then
  echo "Uso: cross-section-check.sh <arquivo.md> [<arquivo.md>...]" >&2
  exit 2
fi

if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; DIM=""; RESET=""
fi

# check_pattern <file> <label> <regex>
#
# - Extrai matches únicos do regex.
# - Se 0 ocorrências: silente (não é aplicável a esse doc).
# - Se 1 valor distinto + repetido: ✓ consistente.
# - Se 2+ valores distintos: ⚠ flag drift potencial.
check_pattern() {
  local file="$1"
  local label="$2"
  local regex="$3"

  # Extrai todos os matches, um por linha.
  local matches
  matches=$(grep -oE "$regex" "$file" 2>/dev/null || true)

  if [ -z "$matches" ]; then
    return
  fi

  # Total de ocorrências (linhas não-vazias).
  local total
  total=$(printf '%s\n' "$matches" | grep -cv '^$' || true)
  total=${total:-0}

  # Valores únicos.
  local unique_values
  unique_values=$(printf '%s\n' "$matches" | sort -u | grep -v '^$' || true)
  local unique_count
  if [ -z "$unique_values" ]; then
    unique_count=0
  else
    unique_count=$(printf '%s\n' "$unique_values" | wc -l | tr -d ' ')
  fi

  if [ "$unique_count" -le 0 ]; then
    return
  fi

  if [ "$unique_count" -eq 1 ]; then
    if [ "$total" -gt 1 ]; then
      printf "  ${GREEN}✓${RESET} %s: %s ${DIM}(%dx — consistente)${RESET}\n" "$label" "$unique_values" "$total"
    fi
    # Se total=1, não reporta (1 menção, irrelevante pra cross-section).
  else
    printf "  ${YELLOW}⚠${RESET} %s: ${RED}%d valores distintos${RESET}\n" "$label" "$unique_count"
    printf '%s\n' "$unique_values" | sed 's/^/        /'
  fi
}

# Padrões observados nos PDFs reais Beyond + outros docs Elven.
# Cada padrão: (label, regex). Regex captura o valor inteiro pra comparação textual.
#
# Patterns desabilitados por taxa de false positive alta:
# - "Severidade SEV[1-4]" — capturava placeholders <SEV1|SEV2|SEV3> em templates.
# - "Janela BRT HH:MM-HH:MM" — capturava substring de timestamps HH:MM:SS.
# Ambos fragilizavam o report. Cobertura desses claims fica pro review humano.
check_file() {
  local file="$1"
  echo "${file}"

  # 1. MTTD / MTTR
  check_pattern "$file" "MTTD" 'MTTD[[:space:]]*[=:]?[[:space:]]*\*?\*?[0-9]+[[:space:]]*(min|s|minutos|segundos)'
  check_pattern "$file" "MTTR" 'MTTR[[:space:]]*[=:]?[[:space:]]*\*?\*?[0-9]+[[:space:]]*(min|s|minutos|segundos)'

  # 2. VUs sustentados / max — só captura "VUs sustentados" / "VUs atingidos" / "Max VUs"
  #    (evita capturar ramp steps "200 VUs em 2 min").
  check_pattern "$file" "VUs (max/sustentado)" '(Max[[:space:]]+VUs[[:space:]]+Atingidos[[:space:]]+|sustentados?[[:space:]]+|atingidos?[[:space:]]+|simultaneamente[[:space:]]+|simult[âa]neos[[:space:]]+)[0-9]+[[:space:]]*(VUs?)?'

  # 3. Throughput
  check_pattern "$file" "Throughput" '[0-9]+(\.[0-9]+)?[[:space:]]*(req/s|requests/s|RPS)\b'

  # 4. Error rate
  check_pattern "$file" "Error rate" '(error[_[:space:]]rate|taxa[[:space:]]+de[[:space:]]+erro|Taxa[[:space:]]+de[[:space:]]+[Ee]rro)[[:space:]]*[:=]?[[:space:]]*[0-9]+(\.[0-9]+)?%'

  # 5. Pool / connections
  check_pattern "$file" "Pool conexões" '[Pp]ool[[:space:]]+(de[[:space:]]+)?conex[ãoõe]+s?[[:space:]]*[:=]?[[:space:]]*[0-9]+'

  # 6. Total de requests (do report — geralmente aparece 1 vez agregado)
  check_pattern "$file" "Total de Requests" 'Total[[:space:]]+de[[:space:]]+[Rr]equests?[[:space:]]*[:=]?[[:space:]]*~?[0-9.,]+'

  # 7. Quantidade absoluta de chamadas mencionada
  check_pattern "$file" "Total de chamadas" '~?[0-9]+(\.[0-9]+)?[[:space:]]+chamadas\b'

  # 8. p95 / p99 / p999 — latências geralmente quotadas no Resumo Executivo
  check_pattern "$file" "p95" '\bp95[[:space:]]*[=:]?[[:space:]]*[0-9]+(\.[0-9]+)?[[:space:]]*(ms|s)\b'
  check_pattern "$file" "p99" '\bp99[[:space:]]*[=:]?[[:space:]]*[0-9]+(\.[0-9]+)?[[:space:]]*(ms|s)\b'
}

for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "${RED}arquivo não encontrado: ${f}${RESET}" >&2
    continue
  fi
  check_file "$f"
  echo
done

echo "${DIM}cross-section-check é REPORT, não gate. Inconsistência (⚠) exige revisão humana.${RESET}"
echo "${DIM}Quality-gate 6.3 (artifact-contract.md): numbers must match across sections.${RESET}"
exit 0
