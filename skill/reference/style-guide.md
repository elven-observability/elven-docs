# Style Guide — `elven-docs-skill`

Decisões de padronização do skill, cada uma com **evidência interna** (arquivo do repo `elven-observability/docs`) e/ou **fonte externa 2026** (URL + data de acesso).

> Filosofia: nada é decidido por gosto. Toda regra tem justificativa rastreável. Quando evidência interna e fonte externa divergem, vence a interna — o skill codifica a casa, não a internet.

---

## Sumário

- [E1 — TOC: `Sumário` universal](#e1--toc-sumário-universal)
- [E2 — `Quick Start —` (S maiúsculo, em-dash)](#e2--quick-start---s-maiúsculo-em-dash)
- [E3 — Validação dedicada nos templates 1/2/3](#e3--validação-dedicada-nos-templates-123)
- [E4 — Versão de produto fora do H1](#e4--versão-de-produto-fora-do-h1)
- [E5 — Callouts em blockquote tipado](#e5--callouts-em-blockquote-tipado)
- [E6 — Emojis banidos no corpo do doc](#e6--emojis-banidos-no-corpo-do-doc)
- [E7 — Mermaid first; ASCII fallback](#e7--mermaid-first-ascii-fallback)
- [E8 — Heading depth máx H4; tabela sempre com header](#e8--heading-depth-máx-h4-tabela-sempre-com-header)
- [Notas de domínio: OpenTelemetry e Faro](#notas-de-domínio-opentelemetry-e-faro)
- [Notas de RAG/agente IA](#notas-de-rag-agente-ia)
- [Gaps assumidos](#gaps-assumidos)

---

## E1 — TOC: `Sumário` universal

**Decisão.** Toda H2 de Table of Contents chama-se `Sumário`. Exceções:

- `frontend-sdk-guide` usa `Índice` (preserva convenção dos 2 docs frontend do repo).
- `pdtec-spec` pode dispensar TOC quando o doc tem <8 H2 (formato curto).

**Evidência interna.**

- 8 docs usam `## Sumário`: `instrumentacao-java.md:7`, `instrumentacao-dotnet.md:7`, `instrumentacao-python.md:7`, `instrumentacao-nodejs.md:7`, `instrumentacao-kubernetes-operator.md:11`, `instrumentacao-lambda-manual.md:7`, `instrumentacao-serverless-plugin.md:7`, `instalacao-stack-observabilidade-kubernetes.md:9`.
- 2 docs usam `## Índice`: `collector-fe-instrumentation.md:9`, `faro-sdk-instrumentacao-frontend.md:9`. Ambos cobrem domínio frontend/coletor frontend.
- 2 docs sem TOC: `pd-tec-instrumentacao.md`, `pd-tec-variaveis-ecs.md`. Ambos <250 linhas.

**Fonte externa.** Vocabulário fechado de heading é prática de [Diátaxis](https://diataxis.fr/) — recuperado em maio/2026. Diátaxis recomenda estabilidade de seções para reuso e indexação.

---

## E2 — `Quick Start —` (S maiúsculo, em-dash)

**Decisão.** Heading canônico é `## Quick Start`. Quando há variantes (Docker, programático, manual), usar em-dash `—` (U+2014) como separator: `## Quick Start — Docker zero-code`. Hífen simples e dois pontos são REJEITADOS pelo lint.

**Evidência interna.**

- Dominante: `instrumentacao-java.md:143`, `instrumentacao-python.md:97`, `instrumentacao-nodejs.md:88` usam `## Quick Start —`.
- Drift: `instrumentacao-dotnet.md:130` usa hífen simples; `instalacao-stack-observabilidade-kubernetes.md:132` usa minúsculo `Quick start`. Skill normaliza.

**Tensão com fonte externa.**

- [Microsoft Style Guide — Capitalization](https://learn.microsoft.com/en-us/style-guide/capitalization) (acessado maio/2026): recomenda **sentence-case** para títulos e headings em inglês — capitaliza só a primeira palavra.
- [Google developer documentation style guide — Headings and titles](https://developers.google.com/style/headings) (acessado maio/2026): mesma regra; sentence-case universal.

**Por que NÃO seguimos sentence-case.**

1. **Idioma.** Microsoft e Google guiam **English**. Português brasileiro não tem norma estabelecida de sentence-case para headings — capitalização de termos compostos é decisão de casa.
2. **Consistência interna.** 8/12 docs do repo já usam `Quick Start`. Mudar pra `Quick start` seria normalizar pela minoria.
3. **Identidade de produto.** "Quick Start" é frase técnica reconhecível; tratar como entidade nomeada.

A decisão fica registrada como **deviation deliberada das style guides em inglês**, não como ignorância delas.

---

## E3 — Validação dedicada nos templates 1/2/3

**Decisão.** Templates `language-instrumentation-guide`, `platform-instrumentation-guide` e `stack-installation-guide` exigem seção `## Validação ponta a ponta` (ou `## Validação após a instalação` para stack). Templates `frontend-sdk-guide` e `pdtec-spec` podem embutir validação no Quick Start ou no Checklist.

**Evidência interna.** 5/12 docs já têm seção dedicada de validação:

- `instrumentacao-java.md` — seção "Validação ponta a ponta"
- `instalacao-stack-observabilidade-kubernetes.md` — seção "Validação"
- `instrumentacao-kubernetes-operator.md` — seção "Validação"
- `instrumentacao-lambda-manual.md` — seção "Validar"
- `instrumentacao-dotnet.md` — seção "Validação"

Os 7 restantes embutem validação solta em prosa ou troubleshooting — drift que o skill normaliza.

**Justificativa.** Quick Start sem validação é receita pra cliente reportar "ferramenta não funciona" quando a config está OK mas ele não sabe como verificar.

---

## E4 — Versão de produto fora do H1

**Decisão.** H1 NUNCA carrega versão de produto. Versão vai pro frontmatter `product_version` (opcional). Tabela de pré-requisitos pode listar versões mínimas suportadas (`>= X.Y`).

**Evidência interna.**

- `faro-sdk-instrumentacao-frontend.md:1` — H1 com versão: `# Instrumentação Frontend com Grafana Faro Web SDK v2`. Drift.
- `instrumentacao-dotnet.md` — versão em tabela de pré-req. OK como mínimo, mas `product_version` no frontmatter é mais explícito.
- `instrumentacao-kubernetes-operator.md` — sem versão. OK porque K8s Operator é Elven-mantido.

**Justificativa.** H1 é cabeçalho perene. Quando v2 vira v3, refazer doc não exige rebatismo de H1; basta atualizar `product_version` e ajustar conteúdo.

---

## E5 — Callouts em blockquote tipado

**Decisão.** Todo callout vai em blockquote `>` com prefixo bold tipado de vocabulário fechado:

- `> **Atenção:**` — risco operacional
- `> **Importante:**` — pré-condição crítica
- `> **Nota:**` — informação contextual
- `> **Dica:**` — atalho ou boa prática
- `> **Cuidado:**` — risco de segurança/dados
- `> **Aviso:**` — limitação ou comportamento não-óbvio

Bold inline de mesmo prefixo (`**Atenção:**` fora de `>`) é **REJEITADO** pelo lint.

**Evidência interna.** No repo, blockquote `>` aparece ~58 vezes contra ~7 usos de bold inline. A maioria já está no padrão; o skill apenas normaliza a minoria. Exemplos canônicos:

- `instalacao-stack-observabilidade-kubernetes.md:5` — `> Este é o caminho recomendado para aplicações...`
- `pd-tec-instrumentacao.md:5` — `> **Toda a configuração de endpoints, credenciais e tunning...**`
- `collector-fe-instrumentation.md:65` — `> **Atenção:** O LOKI_URL deve conter apenas a URL base...`

**Justificativa.** Blockquote é semântico (HTML `<blockquote>`), tem suporte universal a renderers, é skim-friendly em terminal e desktop, e quebra menos em RAG chunking porque preserva delimitadores.

---

## E6 — Emojis banidos no corpo do doc

**Decisão.** Emojis (codepoints `[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]`) são **banidos** do corpo do doc. Use texto explícito: `**OK**`, `**Falha**`, `**Atenção:**`. Lint rejeita.

**Evidência interna.**

- 10/12 docs do repo zero emoji.
- `instrumentacao-nodejs.md` tem 2 (✅❌, em tabela) — drift.
- `instrumentacao-serverless-plugin.md` tem 7 mistos (⚠📍🏗📦✅) — drift.

São acidentes, não padrão.

**Fonte externa.**

- [W3C WCAG 2.2 — Understanding SC 1.1.1: Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) (acessado maio/2026): emoji é "non-text content" — exige alternativa textual quando carrega informação.
- [W3C WAI Technique H86: Providing text alternatives for emojis, emoticons, ASCII art, and leetspeak](https://www.w3.org/WAI/WCAG20/Techniques/html/H86) (acessado maio/2026): técnica recomenda `aria-label` quando emoji é usado.

**Justificativa.** Markdown renderizado não suporta `aria-label` direto. Banir é mais simples e mais acessível que policiar alternativas. Texto explícito ("**OK**") também é melhor pra RAG chunking e leitura por screen readers.

---

## E7 — Mermaid first; ASCII fallback

**Decisão.** Diagramas em `mermaid` fence. ASCII permitido apenas como fallback quando Mermaid não cabe (layout extremamente customizado, tabela visual de layers).

**Evidência interna.**

- 0 docs do repo usam Mermaid hoje.
- 3 docs usam ASCII art em fence `text` ou puro: `collector-fe-instrumentation.md`, `instrumentacao-java.md`, `instrumentacao-python.md`.

Migração dos 3 ASCII existentes pra Mermaid é Fase 7+, não bloqueia release v0.1.0.

**Fonte externa.**

- [GitHub Docs — Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) (acessado maio/2026): Mermaid renderiza nativamente em GitHub-flavored Markdown desde fevereiro 2022.
- [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) (acessado maio/2026): suporte a flowchart, sequence, class, state, ER, gantt, gitGraph, pie, requirement, mindmap, timeline, sankey, Wardley.

**Limitações conhecidas.**

- Nem todos os símbolos suportados (FontAwesome icons em labels às vezes falham).
- Hyperlinks/tooltips em labels podem não funcionar.
- Tema dark é parcial.

Quando Mermaid não cobre, fallback é ASCII em fence `text` com indentação preservada.

---

## E8 — Heading depth máx H4; tabela sempre com header

**Decisão.** Hierarquia de headings vai até H4. H5+ é **REJEITADO** pelo lint. Toda tabela tem header row (linha de `|---|`).

**Evidência interna.** Repo é consistente em H1-H4; H5 não aparece. Tabelas todas com header.

**Justificativa.**

- H5+ indica seção que deveria ser doc separado.
- Tabela sem header confunde leitor e quebra renderers.

---

## Notas de domínio: OpenTelemetry e Faro

### OpenTelemetry

- [OpenTelemetry Documentation Style Guide](https://opentelemetry.io/docs/contributing/style-guide/) (acessado maio/2026): comunidade OTel usa **markdownlint** (configurado em `.markdownlint.json`) + Prettier + spell check + filename validation (kebab-case). Alinhamento parcial: kebab-case já adotado no repo Elven; markdownlint é roadmap pós-v0.1.0.

### Grafana Faro Web SDK

- [Faro Web SDK v2.0 GA — Grafana Labs (2025-11-21)](https://grafana.com/whats-new/2025-11-21-faro-web-sdk-v20-is-now-ga/) (acessado maio/2026): v2 é o release atual. v3 não existe.
- Mudanças relevantes em v2: removido FID (substituído por INP), Tracing APIs simplificadas, helpers `createReactRouterV7Options`/`createReactRouterV7DataOptions`.
- O doc atual `faro-sdk-instrumentacao-frontend.md` está alinhado a v2.

---

## Notas de RAG/agente IA

A literatura recente confirma que estrutura estável melhora retrieval:

- [A-RAG: Scaling Agentic Retrieval-Augmented Generation via Hierarchical Retrieval Interfaces (arXiv 2602.03442)](https://arxiv.org/abs/2602.03442) (acessado maio/2026): retrievers hierárquicos com chunking heading-aware superam baselines. Frontmatter + H2 estável é precondição.
- [Reconstructing Context: Evaluating Advanced Chunking Strategies for RAG (arXiv 2504.19754)](https://arxiv.org/abs/2504.19754) (acessado maio/2026): chunking que preserva estrutura de doc tem recall 95% vs ~70% de chunking ingênuo.
- [rag-chunk CLI](https://github.com/messkan/rag-chunk) (acessado maio/2026): preserva header hierarchy ao splitar markdown — exatamente o caso de uso de docs Elven.

**Implicação.** Frontmatter obrigatório (skill v0.1.0) e vocabulário fechado de heading (`canonical-section-headings.md`) são otimizações concretas para consumo por Sentinel/Claude — não decoração.

---

## Gaps assumidos

Pesquisa Fase 2 revelou áreas onde a fundamentação 2026 ainda é fraca. Ficam registrados como gaps a fechar em v0.2+:

1. **pt-BR technical writing 2025/2026.** [Guia prático do português simplificado (Ibict, 2025)](https://labcotec.ibict.br/omp/index.php/edcotec/catalog/book/250) cobre acessibilidade textual mas não tom imperativo formal pra docs técnicas. Decisão de tom (imperativo direto, formal, 3ª pessoa) sustentada principalmente por evidência interna do repo, não por fonte externa.
2. **Stripe/Vercel/Linear benchmarks.** Documentação pública dessas empresas é boa prática mas não há análise estruturada que liste padrões. Comparação fica como "spot check" no checklist humano, não regra automatizada.
3. **Frontmatter retrieval accuracy benchmark.** Não há benchmark dedicado mensurando recall com vs sem frontmatter — afirmação se sustenta por princípio (chunking heading-aware) mas não por número.

Esses gaps NÃO bloqueiam o release v0.1.0. São listados aqui pra honestidade de fundamentação.

---

## Cabeçalho de citação padrão

Quando adicionar fonte externa nova ao style guide, usar formato:

```
[Título da página](URL) (acessado YYYY-MM-DD)
```

Datas no formato ISO. URL absoluta. Acesso registrado é defesa contra link rot.
