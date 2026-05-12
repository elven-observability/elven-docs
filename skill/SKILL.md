---
name: elven-docs-skill
description: |
  Padroniza criação, revisão e renderização (PDF) de documentação técnica e
  relatórios de Professional Services da Elven Works. Cobre 9 tipos canônicos:
  guias de instrumentação (linguagem, plataforma/orquestrador), instalação de
  stack, SDK frontend, specs PDtec, e 4 PS reports (incidente, teste de carga,
  comparativo, spike). Aplica frontmatter YAML obrigatório, vocabulário fechado
  de seções, callouts em blockquote tipado, code fences com linguagem declarada,
  diagramas Mermaid, gate de qualidade automatizado (10 itens binários do lint),
  e renderização markdown→PDF com tema Elven (capa, header, footer) via
  Puppeteer. Use SEMPRE que o usuário pedir "criar guia", "documentar
  instrumentação", "doc Elven", "guia de instalação Elven", "guia PDtec",
  "relatório de incidente", "relatório de teste de carga", "relatório
  comparativo", "relatório de spike", "gerar PDF Elven", ou quando for
  redigir/revisar qualquer .md em elven-observability/docs ou
  elven-observability/docs/ps. NÃO use para tradução pt→en, README de
  subprojetos, ou docs de produtos Elven (Monitoring/Incident/Command Center)
  cuja estrutura ainda não tem 3+ instâncias reais.
---

# Elven Docs Skill

Skill que produz e renderiza docs técnicas + PS reports Elven Works no padrão da casa, sem improvisar quando o tipo não existe no repo.

---

## Antes de começar — checagem rápida

Pare e responda:

1. **Onde o doc vai morar?** Se for `elven-observability/docs/` (técnico) OU `elven-observability/docs/ps/` (relatório pra cliente) → este skill se aplica. Outros caminhos → pare.
2. **É doc de produto Elven (instrumentação, instalação, SDK, PDtec) OU PS report (incidente/carga/comparativo/spike)?** Se sim, escolha o template apropriado abaixo. Se o tipo não cai em nenhum dos 9 templates → **out of scope v0.2.0**. Responda: "Este skill cobre 9 tipos canônicos. Para tipos novos (postmortem oficial Elven Incident, runbook Command Center, etc.), abra issue no repo `elven-docs-skill`."
3. **É tradução pt→en?** Out of scope. Repo é pt-BR-only.

Se passou nas 3 verificações, siga abaixo.

---

## Workflow (11 passos)

### Passo 1 — Identificar o tipo do doc

Árvore de decisão. Pergunta única: **"O que esse doc/relatório entrega?"**

**Docs técnicos (vão em `elven-observability/docs/`):**

- **a)** Como instrumentar UMA linguagem específica (Java, Python, .NET, Node.js, Go, Ruby, …) → **`language-instrumentation-guide`**
- **b)** Como instrumentar via UMA plataforma/orquestrador (K8s Operator, AWS Lambda layers, Serverless plugin, ECS task helper, …) → **`platform-instrumentation-guide`**
- **c)** Como o cliente INSTALA componente Elven na infra dele (stack LGTM, Collector FE, Beyla standalone, …) → **`stack-installation-guide`**
- **d)** Como usar SDK frontend através de N frameworks (React, Next, Angular, Vue, …) → **`frontend-sdk-guide`**
- **e)** Spec curta (<300 linhas) específica de cliente PDtec (variáveis ECS, Dockerfile patch, copy-paste, …) → **`pdtec-spec`**

**PS reports (vão em `elven-observability/docs/ps/` e geram PDF temado):**

- **f)** Relatório formal de incidente para cliente → **`ps-incident-report`**
- **g)** Relatório de teste de carga executado pela Elven → **`ps-load-test-report`**
- **h)** Comparativo entre dois cenários/versões/ambientes → **`ps-comparative-report`**
- **i)** Análise de spike (pico anômalo curto) → **`ps-spike-report`**

**Fallback:**

- **j)** Nenhuma das anteriores → **PARE**. Abra issue no repo `elven-docs-skill`. Não improvise template.

### Passo 2 — Copiar o template

```bash
TEMPLATE=<tipo>            # um dos 5 acima
SLUG=instrumentacao-go     # kebab-case, sem acento, igual ao filename sem .md
cp ~/.claude/skills/elven-docs-skill/templates/${TEMPLATE}.md \
   /Users/leonardozwirtes/Documents/Elven/elven-observability/docs/${SLUG}.md
```

Convenção de slug: minúsculas, hífen como separador, sem acento (`instrumentacao-` não `instrumentação-`).

### Passo 3 — Preencher frontmatter

Spec completa em `reference/frontmatter-spec.md`. 8 campos:

```yaml
---
title: Instrumentação Go com Elven Observability
slug: instrumentacao-go
type: language-instrumentation-guide
audience: [cliente-eng, agente-ia]
product_version: "OTel Go SDK 1.x"
last_reviewed: 2026-05-08
status: draft
owner: docs@elven.works
---
```

Validar imediatamente:

```bash
bash ~/.claude/skills/elven-docs-skill/scripts/lint.sh --frontmatter docs/instrumentacao-go.md
```

### Passo 4 — H1, abertura, Sumário

- **H1**: espelha `title` do frontmatter, sem versão de produto (versão vai no frontmatter, não no H1).
- **Abertura**: 1-2 linhas em pt-BR, imperativo direto. Bold em `traces`, `métricas`, `logs` na primeira menção.
- **Sumário**: H2 chamado **`Sumário`** (universal, exceto `frontend-sdk-guide` que usa `Índice` por convenção da família, e `pdtec-spec` que pode dispensar). Lista de links âncora pra cada H2 do doc. Regenerar links no fim, depois que estrutura estiver completa.

### Passo 5 — Preencher seções obrigatórias na ordem canônica

Cada template tem ossatura específica. Vocabulário de headings em `reference/canonical-section-headings.md`. Se uma seção não se aplica ao seu doc, **NÃO REMOVA** — escreva uma linha explicativa:

> Não se aplica a este guia. (justificativa em 1 linha)

Isso preserva o esqueleto pra o leitor identificar o tipo de cara.

### Passo 6 — Code fences

**SEMPRE** com tag de linguagem. Tabela completa em `reference/code-fence-language-map.md`. Casos comuns:

```bash
# shell scripts, comandos
```

```yaml
# helmfile, k8s manifests, otel-collector config
```

```dockerfile
# Dockerfile snippets
```

```typescript
# Faro, OTel JS code
```

```csharp
# .NET code
```

Lint rejeita ` ``` ` puro (sem tag).

### Passo 7 — Callouts e formatação

- **Callouts**: SEMPRE blockquote `>` com prefixo bold tipado. Vocabulário fechado em `reference/callout-vocabulary.md`:
  - `> **Atenção:**`
  - `> **Importante:**`
  - `> **Nota:**`
  - `> **Dica:**`
  - `> **Cuidado:**`
  - `> **Aviso:**`
- **Bold**: agressivo para variáveis (`**OTEL_EXPORTER_OTLP_ENDPOINT**`), arquivos (`**Dockerfile**`), termos críticos.
- **Italic**: raro. Só quando bold já está sobrecarregado.
- **Emojis**: **BANIDOS** no corpo do doc. Use texto: `**OK**` / `**Falha**` em vez de ✅/❌. Justificativa em `reference/style-guide.md` (WCAG 2.2 SC 1.1.1 + Técnica H86).
- **Versão de produto no H1**: PROIBIDO. Versão vai pro frontmatter `product_version`. H1 fica perene.

### Passo 8 — Diagramas

**Mermaid first**. GitHub renderiza nativamente desde fev/2022. Bloco:

````
```mermaid
flowchart LR
  App[Aplicação .NET] -- OTLP --> Collector[OpenTelemetry Collector]
  Collector --> Loki
  Collector --> Tempo
  Collector --> Mimir
```
````

ASCII só como fallback quando Mermaid não cabe (tabela visual de layers, layout extremamente customizado). Migração de docs ASCII existentes pra Mermaid é Fase 7+.

### Passo 9 — Lint binário

```bash
elven-docs-skill lint docs/instrumentacao-go.md
# ou para PS reports:
elven-docs-skill lint docs/ps/20260302-relatorio-incidente-beyond.md
```

Esperado: `exit 0`. Resolver TODOS os warnings antes de prosseguir. Gate de PR é 10/10.

### Passo 10 — (PS reports) Renderizar PDF

Para tipos `ps-*`, o ciclo de entrega só fecha com PDF. Use:

```bash
elven-docs-skill pdf docs/ps/20260302-relatorio-incidente-beyond.md
# Gera 20260302-relatorio-incidente-beyond.pdf no mesmo diretório.
# Theme automático: 'client' (capa, header, footer, paginação A4).
```

Para forçar o tema:

```bash
elven-docs-skill pdf docs/instrumentacao-java.md --theme internal
# Theme 'internal' para docs técnicos (sem capa, mais denso).
```

**Sempre abra o PDF e revise visualmente** antes de entregar — leitura do markdown não substitui Gate 5 do `quality-gate.md`.

### Passo 11 — Self-review humano + quality gates

Abra os 2 references:

1. `~/.claude/skills/elven-docs-skill/checklists/pre-publish.md` — items granulares por dimensão.
2. `~/.claude/skills/elven-docs-skill/reference/quality-gate.md` — 6 gates de aceite (verdade técnica, coerência narrativa, coerência de artefatos, lint, acessibilidade, pergunta final).

Cubra o que o lint não pega: tom imperativo, completude do Quick Start, comandos rodam em macOS+Linux, ortografia, **PDF renderiza sem clipping**.

### Passo 12 — Atualizar `last_reviewed` e abrir PR

```yaml
last_reviewed: 2026-05-08    # data de hoje
status: stable               # se já está pronto pra entrega/publicar; senão: draft
```

Commit semântico. PR menciona o `type`. Reviewer cola:
- output do `lint` (esperado: exit 0)
- screenshot da primeira página do PDF (para PS reports)

---

## Triggers explícitos

### Use ESTE skill quando o usuário diz

- "criar guia de instrumentação \<X\>"
- "documentar SDK \<X\>"
- "atualizar doc de instalação da stack"
- "fazer um PDtec novo pra cliente Y"
- "revisar/normalizar/lintar elven-observability/docs/\<arquivo\>"
- "preparar PR de docs Elven"
- "redigir relatório de incidente do cliente Z"
- "fazer relatório de teste de carga pro Beyond"
- "preparar comparativo entre cenários A e B"
- "documentar spike de produção"
- "gerar PDF dessa doc"
- "renderizar PS report em PDF"

### NÃO use ESTE skill quando

- O doc é fora de `elven-observability/docs/` ou `elven-observability/docs/ps/`.
- Tipo de documento não cai em nenhum dos 9 templates canônicos. Tipos comuns que **NÃO** estão cobertos: postmortem do Elven Incident (feature do produto), runbook do Command Center (feature), status page (feature), ADR de eng Elven interno, release notes. Para esses, abra issue antes.
- O usuário quer traduzir doc pt→en.
- O usuário quer doc gerada (OpenAPI/Swagger UI, TypeDoc, Sphinx autodoc).
- O usuário quer slides/presentation — use `presentation-mentoring-factory` em vez disso.

Se ambíguo, pergunte ao usuário em vez de improvisar.

---

## Personas alvo (declaradas no frontmatter `audience`)

- **`cliente-eng`** — Engenheiro/SRE no cliente fazendo a integração.
- **`cliente-sre`** — SRE do cliente fazendo deploy/operação de componente hospedado.
- **`cliente-stakeholder`** — Executivo/decisor não-técnico do cliente (CTO/COO); lê Sumário Executivo de PS reports.
- **`agente-ia`** — Sentinel, Claude, ou outro agente AI consumindo doc como contexto estruturado.
- **`eng-elven`** — Engenheiro Elven escrevendo/revisando doc.
- **`onboarding-eng-elven`** — Pessoa nova no time Elven (primeiros 30 dias).

Matriz template × audience: `checklists/persona-coverage.md`.

---

## Recursos do skill

- **Templates** (9): `templates/{language,platform,stack-installation,frontend-sdk,pdtec}-*.md` + `templates/ps-{incident,load-test,comparative,spike}-report.md`
- **Style guide com fontes 2026**: `reference/style-guide.md`
- **Frontmatter spec**: `reference/frontmatter-spec.md`
- **Vocabulário de seções**: `reference/canonical-section-headings.md`
- **Vocabulário de callouts**: `reference/callout-vocabulary.md`
- **Mapa de tags de fence**: `reference/code-fence-language-map.md`
- **Glossário Elven** (4 produtos): `reference/glossary.md`
- **Quality gate** (6 gates): `reference/quality-gate.md`
- **Artifact contract** (o que cada template promete): `reference/artifact-contract.md`
- **Checklists**: `checklists/pre-publish.md`, `checklists/persona-coverage.md`, `checklists/accessibility.md`
- **Lint binário** (10 itens): `scripts/lint.sh`
- **Backfill retroativo**: `scripts/backfill-frontmatter.sh`
- **PDF renderer**: `scripts/render-pdf.js` (acessível via `elven-docs-skill pdf <arquivo.md>`)
- **Temas CSS**: `themes/client.css` (PS reports — capa + header/footer) e `themes/internal.css` (docs técnicos)

---

## O que esse skill DELIBERADAMENTE não faz

- **Não inventa templates pra tipos ausentes.** Se você precisa de tipo novo (postmortem feature do Elven Incident, runbook do Command Center, ADR interno, release notes), pare e abra issue.
- **Não migra docs legados automaticamente.** Migração retroativa é PR humano-supervisionado, não execução de skill.
- **Não traduz pt→en.** Repo é pt-BR-only nesta versão.
- **Não documenta API gerada.** OpenAPI/Swagger UI são outras ferramentas.
- **Não lintha prosa.** Lint estrutural cobre 10 itens binários; prosa é review humano. Adicionar Vale/markdownlint é roadmap.
- **Não cobre features de produtos Monitoring/Incident/Command Center** (taxonomia em `docs.elven.works`). Cobertura desses produtos depende de instâncias reais ≥3 no repo Elven. Hoje só Observability+PS reports atingem o critério.
- **PDF não embute fontes web customizadas.** Tema usa system stack (Helvetica/Inter fallback). Fonte Elven custom é roadmap v0.3+.
