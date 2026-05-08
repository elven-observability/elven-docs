# Plano de Migração Retroativa — Fase 7

Procedimento para aplicar o padrão `@elven-observability/docs-skill` aos **12 docs legados** em `elven-observability/docs/`. Roda em PR separado **após** o skill estar publicado em v0.1.0.

> **Status:** rascunho. Não executar antes de v0.1.0 estar em produção e ter sido usado em ≥1 doc novo (validação real do skill).

---

## Por que PR separado

1. **Reduzir blast radius.** Skill pode ter bug; bug + 12 arquivos migrados = 12 reverts. Skill validado primeiro, migração depois.
2. **Review viável.** PR de 12 arquivos com 11.000 linhas é inreviewável de uma vez. Commits atômicos por arquivo permitem review pontual.
3. **Conteúdo intacto.** Backfill toca SÓ frontmatter; prosa e exemplos ficam idênticos. Diff fica pequeno e auditável.

---

## Pré-requisitos

- Skill `@elven-observability/docs-skill` instalado:

```bash
npm install -g @elven-observability/docs-skill
elven-docs-skill --version  # esperado: 0.1.0+
```

- Repo `elven-observability/docs` em branch limpa (sem alterações pendentes).
- Acesso de write no repo `elven-observability/docs`.

---

## Execução passo a passo

### Passo 1 — Branch dedicada

```bash
cd /caminho/para/elven-observability/docs
git checkout -b chore/backfill-frontmatter-elven-docs-skill-v0.1.0
```

### Passo 2 — Lint baseline (esperado: todos falham)

```bash
elven-docs-skill lint *.md > /tmp/lint-baseline.log
echo "Falhas no baseline: $(grep -c 'falha(s)$' /tmp/lint-baseline.log)"
# Esperado: 12
```

Anexar `/tmp/lint-baseline.log` no PR para registro de "antes".

### Passo 3 — Backfill mecânico

```bash
elven-docs-skill backfill *.md
```

O script:

- Pula docs que já têm frontmatter (none na 1ª migração).
- Cria `<arquivo>.bak` ao lado do original.
- Adiciona frontmatter no topo:
  - `title` ← H1 do arquivo
  - `slug` ← filename
  - `type` ← heurística por nome (vide tabela abaixo)
  - `audience` ← default por type
  - `last_reviewed` ← `git log -1 --format=%ad --date=short`
  - `status: stable`
  - `owner: docs@elven.works`

Heurística de `type`:

| Filename pattern | Type derivado |
|------------------|---------------|
| `pd-tec-*` | `pdtec-spec` |
| `instrumentacao-{java,python,nodejs,dotnet,ruby,go,php,rust}` | `language-instrumentation-guide` |
| `instrumentacao-{kubernetes-operator,lambda-manual,serverless-plugin,ecs,cloud-run}` | `platform-instrumentation-guide` |
| `instalacao-*`, `collector-*` | `stack-installation-guide` |
| `faro-sdk-*`, `*-frontend`, `*-rum-sdk` | `frontend-sdk-guide` |

### Passo 4 — Revisar cada `type` derivado

```bash
grep -A1 '^type:' *.md | head -50
```

Confirmar manualmente que cada arquivo tem o `type` correto. Se algum estiver errado, editar manualmente.

### Passo 5 — Lint pós-backfill

```bash
elven-docs-skill lint *.md > /tmp/lint-post-backfill.log
echo "Falhas após backfill: $(grep -c 'falha(s)$' /tmp/lint-post-backfill.log)"
```

Cada falha residual cai numa das categorias:

- **Item 6 (Sumário/Índice).** Se doc usa "Índice" mas type não é `frontend-sdk-guide`, ou vice-versa: escolher convenção e ajustar heading.
- **Item 7 (Quick Start case).** Substituir "Quick start" por "Quick Start"; substituir hífen simples por em-dash em variantes.
- **Item 8 (fence sem tag).** Adicionar tag de linguagem em cada fence pura. Ver `reference/code-fence-language-map.md`.
- **Item 9 (emoji).** Substituir emoji por texto explícito conforme `reference/style-guide.md` E6.
- **Item 10 (callout não-blockquote).** Mover bold inline `**Atenção:**` para dentro de blockquote `>`.

### Passo 6 — Corrigir drift residual

Para cada arquivo com falha residual, editar manualmente. Não automatizar nesta versão — drift é edge case e ajustes pontuais são mais seguros.

```bash
elven-docs-skill lint instrumentacao-java.md
# Corrigir
elven-docs-skill lint instrumentacao-java.md  # repetir até 0
```

### Passo 7 — Limpar `.bak`

```bash
rm *.bak
```

### Passo 8 — Commits atômicos por arquivo

```bash
for f in *.md; do
  git add "$f"
  git commit -m "docs($f): adiciona frontmatter v0.1.0 + corrige drift"
done
```

(Se for via script: 12 commits, um por arquivo.)

### Passo 9 — Push + PR

```bash
git push origin chore/backfill-frontmatter-elven-docs-skill-v0.1.0
gh pr create \
  --title "chore: backfill frontmatter dos 12 docs (skill v0.1.0)" \
  --body "$(cat <<EOF
## Contexto

Aplica o padrão @elven-observability/docs-skill v0.1.0 aos 12 docs legados.
Skill: https://github.com/elven-observability/elven-docs

## O que muda

- Adiciona frontmatter YAML (8 campos) em todos os docs.
- Corrige drift residual: Sumário/Índice, Quick Start case, fences, emojis, callouts.

## O que NÃO muda

- Prosa, exemplos de código, estrutura de seções, links.

## Verificação

\`\`\`bash
elven-docs-skill lint *.md
\`\`\`

Esperado: exit 0 (todos passam).

## Baseline antes/depois

- Antes: 74 falhas, 12 docs em drift.
- Depois: 0 falhas, 12 docs no padrão.

## Reviewers

- 1 par técnico Elven
- 1 representante de cliente-eng / cliente-sre (se possível)

## Out of scope

- Tradução pt→en (repo é pt-BR-only v1).
- Refatoração de prosa.
- Migração de ASCII pra Mermaid (Fase 7+ separada).
EOF
)"
```

---

## Tabela de migração esperada

| Arquivo | Type derivado | Falhas residuais esperadas (correção manual) |
|---------|---------------|--------------------------------------------|
| `instrumentacao-java.md` | `language-instrumentation-guide` | item 8 (fences sem tag em código de exemplo) |
| `instrumentacao-dotnet.md` | `language-instrumentation-guide` | item 7 (Quick Start `-` em vez de `—`) |
| `instrumentacao-python.md` | `language-instrumentation-guide` | item 8 |
| `instrumentacao-nodejs.md` | `language-instrumentation-guide` | item 8, item 9 (emoji) |
| `instrumentacao-kubernetes-operator.md` | `platform-instrumentation-guide` | item 8 |
| `instrumentacao-lambda-manual.md` | `platform-instrumentation-guide` | (a verificar) |
| `instrumentacao-serverless-plugin.md` | `platform-instrumentation-guide` | item 8, item 9 |
| `instalacao-stack-observabilidade-kubernetes.md` | `stack-installation-guide` | item 7 ("Quick start" minúsculo) |
| `collector-fe-instrumentation.md` | `stack-installation-guide` | item 6 ("Índice" em vez de "Sumário") |
| `faro-sdk-instrumentacao-frontend.md` | `frontend-sdk-guide` | (deve passar limpo) |
| `pd-tec-instrumentacao.md` | `pdtec-spec` | item 8 |
| `pd-tec-variaveis-ecs.md` | `pdtec-spec` | item 8 |

---

## Edge cases conhecidos

### Edge 1: docs com múltiplos H1 reais

Se algum doc tem 2 H1s legítimos (não em code blocks), o backfill não resolve — exige split em 2 docs ou rebaixar 1 a H2.

### Edge 2: docs com headings ASCII art

Algumas seções têm `## ┌──┐` ou similares. Lint não trata isso especificamente; revisor humano confirma se vira heading semântico ou fica como decoração.

### Edge 3: `last_reviewed` muito antigo

Backfill usa data do último commit. Para docs estagnados (último commit em 2024), o frontmatter sai com data antiga. Lint warning aparece (>180 dias). Decisão: aceitar a verdade ou atualizar manualmente como parte da revisão.

### Edge 4: docs sem H1 limpo

Se H1 for ambíguo (ex: tem prefixo de versão), `title` no frontmatter sai estranho. Revisor humano corrige.

---

## Critério de sucesso

- [ ] PR mergeado com commits atômicos por arquivo.
- [ ] `elven-docs-skill lint *.md` em CI retorna exit 0 para todos os 12 docs.
- [ ] Sentinel/Claude consegue filtrar docs por `type` em RAG sem reabrir cada arquivo (validar amostralmente).
- [ ] Não houve regressão de prosa (diff só toca frontmatter ou heading drift; revisor confirma).

---

## Pós-migração: roadmap

- Adicionar `elven-docs-skill lint *.md` ao GitHub Actions do repo `elven-observability/docs` (gate de PR).
- Pre-commit hook opcional via husky pra autores que querem feedback local.
- Migração de ASCII → Mermaid em PR separado (Fase 7.1).

---

## Rollback

Se o PR causar problema imprevisto:

```bash
git revert <merge-commit-sha>
```

Ou voltar pelos `.bak` (se você ainda os tem):

```bash
for f in *.bak; do
  mv "$f" "${f%.bak}"
done
```
