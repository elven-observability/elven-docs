#!/usr/bin/env bash
#
# backfill-frontmatter.sh — adiciona frontmatter YAML a docs legados.
#
# USAR APENAS NA FASE 7 (migração retroativa). NÃO rodar como parte do CI v1.
#
# Para cada arquivo passado:
#   - se já tem frontmatter (linha 1 == "---"), pula com aviso
#   - senão, deriva campos por heurística:
#       title           ← primeiro "# ..." do arquivo
#       slug            ← basename(file, .md)
#       type            ← heurística por nome (pd-tec-*, instrumentacao-*, etc)
#       audience        ← default conforme type
#       last_reviewed   ← último commit do arquivo (git log) ou data atual
#       status          ← stable
#       owner           ← docs@elven.works (revisar manualmente no PR)
#   - escreve frontmatter no início; preserva conteúdo original abaixo
#   - edita o arquivo IN-PLACE (faz backup .bak ao lado)
#
# Uso:
#   bash skill/scripts/backfill-frontmatter.sh <arquivo.md> [<arquivo.md>...]
#
# Exit:
#   0  todos processados (incluindo skip de já-com-frontmatter)
#   1  erro fatal em algum arquivo
#   2  uso incorreto

set -uo pipefail

if [ $# -eq 0 ]; then
  echo "Uso: backfill-frontmatter.sh <arquivo.md> [<arquivo.md>...]" >&2
  exit 2
fi

derive_type() {
  local fname="$1"
  case "$fname" in
    pd-tec-*) echo "pdtec-spec" ;;
    instrumentacao-java|instrumentacao-dotnet|instrumentacao-python|instrumentacao-nodejs|instrumentacao-ruby|instrumentacao-go|instrumentacao-php|instrumentacao-rust)
      echo "language-instrumentation-guide" ;;
    instrumentacao-kubernetes-operator|instrumentacao-lambda-manual|instrumentacao-serverless-plugin|instrumentacao-ecs|instrumentacao-cloud-run)
      echo "platform-instrumentation-guide" ;;
    instalacao-*|collector-fe-instrumentation|collector-*)
      echo "stack-installation-guide" ;;
    faro-sdk-*|*-frontend|*-rum-sdk)
      echo "frontend-sdk-guide" ;;
    *-relatorio-incidente-*|*relatorio-incidente*)
      echo "ps-incident-report" ;;
    *-relatorio-teste-carga-*|*relatorio-teste-carga*|*-relatorio-carga-*)
      echo "ps-load-test-report" ;;
    *-relatorio-comparativo-*|*relatorio-comparativo*)
      echo "ps-comparative-report" ;;
    *-relatorio-spike-*|*relatorio-spike*)
      echo "ps-spike-report" ;;
    *)
      echo "" ;;
  esac
}

derive_audience() {
  local type="$1"
  case "$type" in
    language-instrumentation-guide) echo "[cliente-eng, agente-ia]" ;;
    platform-instrumentation-guide) echo "[cliente-eng, agente-ia, onboarding-eng-elven]" ;;
    stack-installation-guide) echo "[cliente-sre, agente-ia, onboarding-eng-elven]" ;;
    frontend-sdk-guide) echo "[cliente-eng, agente-ia]" ;;
    pdtec-spec) echo "[cliente-eng, agente-ia]" ;;
    ps-incident-report|ps-load-test-report|ps-comparative-report|ps-spike-report)
      echo "[cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]" ;;
    *) echo "[cliente-eng, agente-ia]" ;;
  esac
}

last_commit_date() {
  local f="$1"
  if command -v git >/dev/null 2>&1; then
    local d
    d=$(git -C "$(dirname "$f")" log -1 --format=%ad --date=short -- "$(basename "$f")" 2>/dev/null || echo "")
    if [ -n "$d" ]; then
      echo "$d"
      return
    fi
  fi
  date +%Y-%m-%d
}

extract_h1() {
  local f="$1"
  awk '/^# / { sub(/^# /, ""); print; exit }' "$f"
}

backfill_one() {
  local file="$1"

  if [ ! -f "$file" ]; then
    echo "  ✗ arquivo não encontrado: $file" >&2
    return 1
  fi

  if [ "$(head -1 "$file")" = "---" ]; then
    echo "  ⊘ pulando (já tem frontmatter): $file"
    return 0
  fi

  local fname slug title type audience last_reviewed
  fname=$(basename "$file" .md)
  slug="$fname"
  title=$(extract_h1 "$file")
  if [ -z "$title" ]; then
    title="(preencher manualmente)"
  fi
  type=$(derive_type "$fname")
  if [ -z "$type" ]; then
    echo "  ! não consegui derivar 'type' para '${fname}'; preencha manualmente."
    type="UNKNOWN"
  fi
  audience=$(derive_audience "$type")
  last_reviewed=$(last_commit_date "$file")

  cp "$file" "${file}.bak"

  {
    echo "---"
    echo "title: ${title}"
    echo "slug: ${slug}"
    echo "type: ${type}"
    echo "audience: ${audience}"
    echo "last_reviewed: ${last_reviewed}"
    echo "status: stable"
    echo "owner: docs@elven.works"
    echo "---"
    echo
    cat "${file}.bak"
  } > "$file"

  echo "  ✓ ${file} (type=${type}, last_reviewed=${last_reviewed})"
}

failed=0
for f in "$@"; do
  echo "${f}"
  if ! backfill_one "$f"; then
    failed=$((failed + 1))
  fi
done

echo
if [ $failed -gt 0 ]; then
  echo "total: ${failed} falha(s); revise manualmente."
  exit 1
fi
echo "backfill concluído. arquivos .bak criados ao lado dos originais."
echo "próximo passo: rodar 'elven-docs-skill lint <arquivos>' e ajustar drift residual."
