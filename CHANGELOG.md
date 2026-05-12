# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.4.0] - 2026-05-12

### Added

- **Mermaid offline (opt-in).** Flag `--mermaid bundle` injeta `mermaid@11` local (~3 MB do `node_modules`) inline no HTML. Default segue CDN jsdelivr (rápido, leve). ENV `ELVEN_MERMAID_MODE=bundle` aplica como default. Útil em CI sem internet ou em ambientes com restrição outbound.
- **Cross-section check** (`skill/scripts/cross-section-check.sh` + CLI `elven-docs-skill check`). Report (não gate) de claims numéricas duplicadas:
  - MTTD / MTTR (min / s)
  - VUs (max/sustentado)
  - Throughput (req/s, RPS)
  - Error rate (%)
  - Pool de conexões
  - Total de requests
  - p95 / p99 latência
  - Total de chamadas
  Exit sempre 0. ⚠ flag indica drift potencial; ✓ confirma consistência. Ajuda quality-gate 6.3 ("numbers must match across sections").
- **Subcomando `check`** no CLI bin com forwarding pra script shell.
- **Exemplo vivo** `skill/examples/demo-ps-incident-report.md` — dados anonimizados (TestCo) com estrutura espelhando 1:1 o PDF real Beyond `20260302-relatorio-incidente.pdf`. Render gera PDF de 6 páginas com headings idênticos ao real (validado via pdftotext diff). Serve como referência viva pra autores de PS reports.
- **`skill/examples/README.md`** com convenção de anonimização, lista de exemplos planejados, e instruções de comparação com PDF real.
- **CSS `.mermaid`** ajustado nos 2 temas (centralização, max-width, page-break-inside).
- **Dep:** `mermaid@^11.15.0` (3.2 MB minified) — apenas usada em `--mermaid bundle`. CDN segue como default leve.

### Changed

- **render-pdf.js** refatorado:
  - Aceita `--mermaid <cdn|bundle>` (default `cdn`).
  - Init Mermaid agora é `mermaid.run().then(...).catch(...)` — libera `__mermaidReady__` mesmo em erro de render, evitando timeout pendurar PDF.
  - Bundle mode lê `mermaid/dist/mermaid.min.js` via `require.resolve` — funciona após `npm install`.
- **`render-pdf.test.sh`** agora valida bundle mode também (4 PDFs renderizados, era 3).
- **`artifact-contract.md`** atualizado pra refletir v0.3.0+ (templates espelhando realidade Beyond) + referência a `elven-docs-skill check` na regra de coerência cruzada.

### Validated end-to-end

- Demo `demo-ps-incident-report.md` (TestCo, sintético) → renderização pelo skill → comparado via `pdftotext -layout` com PDF real Beyond. **Headings 1:1 idênticos** (5 seções numeradas, 6 páginas). Estrutura do template valida contra realidade entregue ao cliente.
- Cross-section-check rodado contra texto real do `20260306-relatorio-teste-carga-beyond.pdf`: detectou ⚠ Throughput 157 req/s vs 32 req/s (real diff entre testes). Zero false positives nos templates esqueleto + fixtures + demo.

### Fixed

- **Lint item 1 flakiness (SIGPIPE racing).** Bug latente desde v0.1.0: a verificação de fechamento de frontmatter usava pipeline `head -30 | tail -29 | grep -qE '^---$'` com `set -uo pipefail` ativo. Quando `grep -q` fechava o pipe após o primeiro match, `tail` recebia SIGPIPE (exit 141), e pipefail propagava 141 como exit do pipe — o `!` invertia pra "verdadeiro" → falso positivo de "frontmatter não fecha em até 30 linhas". Sintoma: ~30% de falhas espúrias em `lint.test.sh` quando rodado em tight loop (era benign em runs únicos). Fix: substituiu o pipeline por `awk` single-process. Validado: 0/20 falhas em 20 runs sucessivos.

### Out of scope (decisão explícita)

- **Snapshot Grafana via API** — requer credenciais Elven reais. Implementar às cegas viola "sem alucinar". Roadmap quando creds estiverem disponíveis.
- **Fonte web custom Elven** — sem asset Elven publicado.
- **Vale linter** — sem demanda concreta.
- **pt-BR style guide 2026** — gap antigo, pesquisa sem fonte autoritativa nova.
- **Templates feature Monitoring/Incident/Command Center** — docs.elven.works continua minimalista; sem instâncias ≥3.

## [0.3.0] - 2026-05-12

### Changed (breaking pra autores de PS reports)

- **4 templates PS reescritos** espelhando estrutura real dos 7 PDFs entregues a cliente Beyond:
  - Headings com **numeração decimal embarcada** (`## 1. Resumo Executivo`, `### 2.1 Fluxo Testado`) — era textual em v0.2.0.
  - `## Sumário` agora é **lista numerada estática**, não TOC com links âncora.
  - Removido: "Sumário Executivo" (real usa "Resumo Executivo"), "Análise dos 5 porquês", "Glossário" no fim, "Plano de Ação" como tabela formal.
  - `ps-incident-report` agora começa com "Informações da Sessão" (trace ID, member ID, log group) — padrão diagnóstico real.
  - `ps-incident-report` inclui seção "Queries — Loki / CloudWatch Logs Insights" com 6+ queries reproduzíveis.
  - `ps-load-test-report` segue ossatura Beyond v1-v3: Resumo Exec → Escopo+Metodologia → Infra → Resultados → Gargalo Principal → Gargalo Secundário → Problemas Infra → Recomendações → Próximos Passos → Conclusão.
  - `ps-comparative-report` simplificado: Contexto → Visão Geral → tabelas comparativas por dimensão → Conclusão.
  - `ps-spike-report` inclui "Preparação Realizada Antes do Pico" (escalamento preventivo, correções aplicadas) — padrão real Beyond.
- **Persona primária dos PS reports corrigida** de `cliente-stakeholder` (errado em v0.2.0) para `cliente-eng` + `cliente-sre`. Stakeholder lê só o `## 1. Resumo Executivo`; engenheiro/SRE técnico consome o doc inteiro.
- **Lint item 6** atualizado para PS reports:
  - Exige `## Sumário` (lista numerada).
  - Exige pelo menos um H2 com numeração decimal (`^## \d+\. `).
  - Removida exigência de `## Sumário executivo`.

### Added

- **Mermaid render no PDF.** Blocos ` ```mermaid ` viram SVG renderizado via Mermaid.js (CDN jsdelivr@11) durante o render Puppeteer. Theme variables ajustadas pra cores Elven. `waitForFunction` aguarda `__mermaidReady__` por até 15s.
- **Resolver de imagens locais.** `<img src="./caminho/relativo.png">` é convertido em `data:image/png;base64,...` antes do render. Suporta PNG, JPEG, GIF, SVG, WebP. Resolução relativa ao diretório do `.md`. Loga warning se arquivo ausente; preserva src original.
- **CSS para `.mermaid`** nos 2 temas (espaçamento, centralização, max-width).
- **Fixture pass-mermaid-and-image** valida ambas features end-to-end.

### Validated against real PDFs

7 PDFs reais de `docs/ps/` (cliente Beyond) extraídos via pdftotext e comparados aos templates v0.2.0. Drift sério encontrado em headings, persona, vocabulário. v0.3.0 corrige espelhando a realidade — **não impondo um upgrade não solicitado**.

## [0.2.0] - 2026-05-12

### Added

- **4 templates PS report** (entregues a cliente como PDF):
  - `ps-incident-report` — relatório formal de incidente com linha do tempo, MTTD/MTTR, causa raiz, 5 porquês, plano de ação.
  - `ps-load-test-report` — relatório de teste de carga com metodologia, resultados (p50/p95/p99, RPS, error rate), bottlenecks, recomendações.
  - `ps-comparative-report` — comparativo entre dois cenários com critério de decisão, métricas lado a lado, trade-offs, recomendação.
  - `ps-spike-report` — análise de spike anômalo com hipóteses (confirmada/descartada/inconclusiva), evidência, conclusão.
- **Geração de PDF via Puppeteer** (`elven-docs-skill pdf <arquivo.md>`):
  - Tema `client` (capa + header/footer + paginação A4 + cores Elven) — default para PS reports.
  - Tema `internal` (sem capa, mais denso) — default para docs técnicos.
  - Detecção automática de tema por `type`.
  - Classes semânticas de callout (Atenção/Importante/Nota/Dica/Cuidado/Aviso) com cores apropriadas.
  - Capa com título, cliente, data, severidade, owner extraídos do frontmatter.
- **Nova persona** `cliente-stakeholder` (executivo/decisor não-técnico) — alvo primário dos Sumários Executivos em PS reports.
- **Referências novas**:
  - `reference/quality-gate.md` — 6 gates de aceite (inspirado em `claude-presentation-skill`).
  - `reference/artifact-contract.md` — o que cada um dos 9 templates promete entregar.
- **Glossário expandido** com os 4 produtos top-level Elven Works ([docs.elven.works](https://docs.elven.works/)): Elven Monitoring, Elven Observability, Elven Incident, Command Center.
- **Backfill heurístico para PS reports**: prefixos `*-relatorio-{incidente,teste-carga,comparativo,spike}-*` mapeados automaticamente.
- **Subcomando CLI `pdf`** com opções `--out` e `--theme`.
- **2 temas CSS**: `themes/client.css` e `themes/internal.css`.
- **Fixtures novos**: `pass-ps-incident-report.md` (passes) e `fail-ps-no-sumario-executivo.md` (verifica regra de Sumário Executivo).
- **Smoke test de PDF** em `tests/render-pdf.test.sh` — valida assinatura `%PDF-` e tamanho mínimo.
- **Dependências runtime**: `marked@^14.1.0` e `puppeteer@^23.5.0`.

### Changed

- **`type` enum no frontmatter** agora aceita 9 valores (eram 5 em v0.1.0).
- **Lint item 6** valida `## Sumário executivo` obrigatório em todos os PS reports.
- **Lint item 7** pula validação de "Quick Start" em PS reports (não se aplica).
- **`SKILL.md`** com escopo ampliado: descrição, triggers `when_to_use`, árvore de decisão (9 ramos), workflow (12 passos incluindo render PDF e quality gates).
- **`README.md`**: nova tabela de templates, seção PDF, atualização de keywords.
- **`persona-coverage.md`** com matriz expandida (6 personas × 9 templates).

### Out of scope (v0.2.0)

- Templates de produto Elven (Monitoring/Incident/Command Center features) — `docs.elven.works` tem páginas minimalistas demais para servirem de base.
- Tradução pt→en.
- Fontes web customizadas no PDF (system stack apenas; roadmap v0.3).
- Vale linter / prose linting.

## [0.1.0] - 2026-05-08

### Added

- Skill `elven-docs-skill` no formato Anthropic skill-creator.
- 5 templates canônicos derivados do repo `elven-observability/docs`:
  - `language-instrumentation-guide` (4 instâncias no repo)
  - `platform-instrumentation-guide` (3 instâncias)
  - `stack-installation-guide` (2 instâncias, exceção justificada)
  - `frontend-sdk-guide` (1 instância, exceção justificada)
  - `pdtec-spec` (2 instâncias)
- Frontmatter YAML obrigatório (8 campos: `title`, `slug`, `type`, `audience`, `product_version`, `last_reviewed`, `status`, `owner`).
- Vocabulário fechado de seções em `reference/canonical-section-headings.md`.
- Vocabulário fechado de callouts (blockquote tipado) em `reference/callout-vocabulary.md`.
- Mapa de tags de code fence por linguagem em `reference/code-fence-language-map.md`.
- Glossário Elven autoritativo em `reference/glossary.md`.
- Style guide `reference/style-guide.md` com decisões E1-E8 e citações 2026 (Diátaxis, WCAG 2.2, Anthropic skill-creator, Microsoft/Google style guides, Mermaid, OpenTelemetry).
- Lint script binário `skill/scripts/lint.sh` com 10 verificações automatizadas.
- Script de migração retroativa `skill/scripts/backfill-frontmatter.sh` (Fase 7 — não roda no CI v1).
- Testes shell + 6 fixtures (1 pass, 5 fail) em `tests/`.
- CLI `elven-docs-skill` com subcomandos `install`, `update`, `lint`, `--version`, `--help`.
- Distribuição via npm: `npm install -g @elven-observability/docs-skill && elven-docs-skill install`.

### Out of scope (v1)

- Templates para ADR, runbook, post-mortem, RFC, changelog, release notes — sem instâncias no repo.
- Tradução pt→en — repo é pt-BR-only.
- Migração retroativa dos 12 docs legados — Fase 7 separada (PR mecânico pós-v0.1.0).

[Unreleased]: https://github.com/elven-observability/elven-docs/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/elven-observability/elven-docs/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/elven-observability/elven-docs/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/elven-observability/elven-docs/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/elven-observability/elven-docs/releases/tag/v0.1.0
