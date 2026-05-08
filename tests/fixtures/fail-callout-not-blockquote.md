---
title: Doc com callout fora de blockquote
slug: fail-callout-not-blockquote
type: language-instrumentation-guide
audience: [cliente-eng, agente-ia]
last_reviewed: 2026-05-08
status: stable
owner: docs@elven.works
---

# Doc com callout fora de blockquote

Bold inline `**Atenção:**` em linha que não começa com `>` — esperado falhar item 10.

---

## Sumário

- [Visão geral](#visão-geral)

## Visão geral

**Atenção:** Este callout está fora de blockquote — deveria falhar.

```bash
echo ok
```
