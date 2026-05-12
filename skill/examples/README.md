# `examples/`

Exemplos vivos — 1 doc preenchido por template canônico, mostrando como o esqueleto vira doc real.

> **Aviso:** Estes exemplos usam dados **sintéticos anonimizados**. Estrutura espelha 1:1 docs reais entregues a cliente (ex: `demo-ps-incident-report.md` segue o padrão real Beyond), mas todos os IDs, números de telefone, trace IDs, e nomes de feature são fictícios. Não copie o conteúdo — copie o **template** em `../templates/`.

---

## Status

**v0.4.0:** 1 exemplo disponível.

| Arquivo | Template | Conteúdo |
|---------|----------|----------|
| `demo-ps-incident-report.md` | `ps-incident-report` | War Room síntese de lentidão (TestCo, SEV2). Estrutura validada contra PDF Beyond real de 02/03/2026. |

Templates ainda sem exemplo (roadmap):

- `language-instrumentation-guide`
- `platform-instrumentation-guide`
- `stack-installation-guide`
- `frontend-sdk-guide`
- `pdtec-spec`
- `ps-load-test-report`
- `ps-comparative-report`
- `ps-spike-report`

---

## Convenção quando adicionar exemplo novo

- Filename: `demo-<template-slug>.md`.
- Frontmatter `status: stable` (exemplo já revisado), `slug: demo-<template-slug>`.
- Dados:
  - **Cliente:** `TestCo`, `AcmeCo`, `ExampleCo` — nunca nome real de cliente Elven.
  - **IDs (member, title, trace):** sintéticos. Trace IDs com prefixo plausível mas valores aleatórios.
  - **Telefones:** prefixo `+5511999...` reservado pra fixtures.
  - **Domínios:** `*.example.com.br`, `testco-prod`, etc.
- Estrutura: **idêntica ao real**. Use pdftotext em PDFs reais como referência. Não invente seções.

---

## Como gerar PDF do exemplo

```bash
# CDN mode (default)
elven-docs-skill pdf ~/.claude/skills/elven-docs-skill/examples/demo-ps-incident-report.md \
  --out /tmp/demo-incident.pdf

# Offline / bundle
elven-docs-skill pdf ~/.claude/skills/elven-docs-skill/examples/demo-ps-incident-report.md \
  --mermaid bundle --out /tmp/demo-incident.pdf

# Validar cross-section claims
elven-docs-skill check ~/.claude/skills/elven-docs-skill/examples/demo-ps-incident-report.md
```

---

## Comparação com PDF real

`demo-ps-incident-report.md` foi escrito **espelhando** a estrutura de `20260302-relatorio-incidente.pdf` (Beyond, real, confidencial). Validação:

```bash
# Extrair texto do real (não commitado neste repo público)
pdftotext -layout /caminho/para/20260302-relatorio-incidente.pdf /tmp/real.txt

# Extrair texto do demo (após gerar PDF)
elven-docs-skill pdf ~/.claude/skills/elven-docs-skill/examples/demo-ps-incident-report.md --out /tmp/demo.pdf
pdftotext -layout /tmp/demo.pdf /tmp/demo.txt

# Comparar estruturas (headings)
grep -E "^[[:space:]]*[0-9]+(\.[0-9]+)?\." /tmp/real.txt | head -20
grep -E "^[[:space:]]*[0-9]+(\.[0-9]+)?\." /tmp/demo.txt | head -20
```

Esperado: lista de seções numericamente idêntica. Diferenças apenas em conteúdo (IDs, nomes sintéticos).
