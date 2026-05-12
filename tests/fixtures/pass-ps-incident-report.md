---
title: Relatório de Incidente — TestCo — 2026-04-15
slug: pass-ps-incident-report
type: ps-incident-report
audience: [cliente-eng, cliente-sre, cliente-stakeholder, eng-elven]
incident_id: "INC-2026-9999"
incident_date: "2026-04-15"
client: "TestCo"
severity: "SEV2"
last_reviewed: 2026-05-12
status: stable
owner: ps@elven.works
---

# War Room — Análise de Lentidão | 15/04/2026 ~14h

Fixture de teste do lint para `ps-incident-report` v0.3.0.

---

## Sumário

1. Informações da Sessão
2. Timeline do Incidente
3. Causa Raiz
4. Recomendação

---

## 1. Informações da Sessão

| Campo | Valor |
|-------|-------|
| Data/Hora | 15/04/2026 a partir das 14:00 BRT |
| Trace ID | `abc123-def456-fixture` |
| Ambiente | Produção (testco-prod) |

> **Importante:** Este é fixture de teste; valores não são reais.

---

## 2. Timeline do Incidente

| Hora (BRT) | Evento |
|------------|--------|
| 14:00 | Início |
| 14:42 | Fim (auto-recovery) |

```bash
curl -s https://testco.example.com/health
```

---

## 3. Causa Raiz

### 3.1 Pool de DB saturado

Texto curto.

```text
HikariPool-1: Connection is not available, request timed out after 30000ms
```

### 3.2 Conclusão

Pool default era 100; carga sustentada precisa de 200+.

---

## 4. Recomendação

Aumentar `max_connections` para 200. Validar com novo teste de carga.
