---
title: Instrumentação Go com Elven Observability
slug: pass-language-guide
type: language-instrumentation-guide
audience: [cliente-eng, agente-ia]
product_version: "OpenTelemetry Go SDK 1.x"
last_reviewed: 2026-05-08
status: stable
owner: docs@elven.works
---

# Instrumentação Go com Elven Observability

Guia completo para instrumentar aplicações Go com **traces**, **métricas** e **logs**.

> **Nota:** Este é um fixture de teste do lint.

---

## Sumário

- [Visão geral](#visão-geral)
- [Quick Start — manual com SDK](#quick-start--manual-com-sdk)
- [Validação ponta a ponta](#validação-ponta-a-ponta)
- [Troubleshooting](#troubleshooting)

---

## Visão geral

Texto curto.

> **Importante:** Em modo Elven, **logs, métricas e traces** ficam sempre ligados.

---

## Quick Start — manual com SDK

```bash
go get go.opentelemetry.io/otel
```

```go
package main

import "go.opentelemetry.io/otel"

func main() {
  _ = otel.GetTracerProvider()
}
```

---

## Validação ponta a ponta

```bash
curl https://app.meusite.com.br/health
```

---

## Troubleshooting

### Métricas não aparecem

**Sintoma.** Painel mostra "no data".

**Causa provável.** Endpoint errado.

**Fix.** Verifique `OTEL_EXPORTER_OTLP_ENDPOINT`.
