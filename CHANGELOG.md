# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

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

[Unreleased]: https://github.com/elven-observability/elven-docs/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/elven-observability/elven-docs/releases/tag/v0.1.0
