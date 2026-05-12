# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

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

[Unreleased]: https://github.com/elven-observability/elven-docs/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/elven-observability/elven-docs/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/elven-observability/elven-docs/releases/tag/v0.1.0
