---
title: Fixture com Mermaid e imagem local
slug: pass-mermaid-and-image
type: platform-instrumentation-guide
audience: [cliente-eng, agente-ia]
last_reviewed: 2026-05-12
status: stable
owner: docs@elven.works
---

# Fixture com Mermaid e imagem local

Doc de teste pra validar render de Mermaid em PDF + resolver de imagem local em data URI.

---

## Sumário

- [Visão geral](#visão-geral)
- [Quick Start — minimal](#quick-start--minimal)
- [Validação ponta a ponta](#validação-ponta-a-ponta)
- [Troubleshooting](#troubleshooting)

---

## Visão geral

Este fixture testa duas features novas do v0.3.0:

1. **Mermaid render** — bloco `mermaid` é convertido em SVG durante o render PDF.
2. **Image resolver** — paths relativos viram data URI.

### Diagrama de arquitetura

```mermaid
flowchart LR
  App[Aplicação] -- OTLP --> Collector[OTel Collector]
  Collector --> Loki
  Collector --> Tempo
  Collector --> Mimir
```

### Asset local

![Pixel Elven dark blue](./assets/dot.png)

---

## Quick Start — minimal

```bash
echo "fixture"
```

---

## Validação ponta a ponta

```bash
test
```

---

## Troubleshooting

### Mermaid não renderiza

**Causa.** Sem internet no momento do render — CDN do mermaid não carrega.

**Fix.** Rodar com internet, ou substituir bloco mermaid por imagem PNG pre-renderizada.
