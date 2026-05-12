---
title: Relatório de Spike — <Cliente> — <YYYY-MM-DD HH:MM BRT>
slug: <YYYYMMDD>-relatorio-spike-<cliente>
type: ps-spike-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
spike_date: "2026-MM-DD"
spike_window_brt: "HH:MM – HH:MM"
client: "<nome-do-cliente>"
severity_estimated: "<informativo|alerta|incidente>"
last_reviewed: 2026-05-08
status: draft
owner: ps@elven.works
---

# Relatório de Spike — <Cliente> — <Data e janela>

Relatório formal entregue pela Elven Works analisando um **spike** (pico anômalo de métrica) detectado em produção. Documenta a janela observada, métricas afetadas, hipóteses, análise e recomendações.

> **Nota:** Spike report difere de incident report em escopo. Spike pode ser informativo (não houve incidente) e ainda assim merece análise. Quando spike vira incidente, este doc é ponto de partida para [ps-incident-report](./ps-incident-report.md).

---

## Sumário

- [Sumário executivo](#sumário-executivo)
- [Janela observada](#janela-observada)
- [Métricas afetadas](#métricas-afetadas)
- [Linha do tempo curta](#linha-do-tempo-curta)
- [Hipóteses levantadas](#hipóteses-levantadas)
- [Análise das hipóteses](#análise-das-hipóteses)
- [Conclusão](#conclusão)
- [Recomendações](#recomendações)
- [Anexos](#anexos)
- [Glossário](#glossário)

---

## Sumário executivo

3-4 parágrafos:

1. **O que aconteceu** em 1 frase (ex: "Pico de latência p99 de 6s observado em checkout-api entre 11/03/2026 14:18 e 14:23 BRT — duração de 5 minutos").
2. **Impacto observado** (houve / não houve usuários afetados; magnitude).
3. **Causa raiz identificada / hipótese mais provável.**
4. **Recomendação principal** (com prazo).

---

## Janela observada

| Aspecto | Valor |
|---------|-------|
| Data | 11/03/2026 |
| Início (BRT) | 14:18 |
| Fim (BRT) | 14:23 |
| Duração | 5 min |
| Fuso | UTC-3 |

### Como o spike foi detectado

- **Detector primário.** Sentinel correlacionou aumento de latência + aumento de error rate.
- **Alerta disparado?** Sim / Não (justificar).
- **Reportado pelo cliente?** Sim / Não (justificar).

---

## Métricas afetadas

### Métrica principal

| Métrica | Baseline (24h prior) | Pico | Delta |
|---------|----------------------|------|-------|
| Latência p99 checkout-api | 1100 ms | 6200 ms | **+463%** |

### Métricas correlacionadas no mesmo período

| Métrica | Baseline | Pico | Delta |
|---------|----------|------|-------|
| Error rate (5xx) | 0.04% | 1.20% | **+30x** |
| Active DB connections | 84/200 | 162/200 | +93% |
| CPU médio (app) | 56% | 72% | +29% |
| Memory médio (app) | 54% | 56% | +4% |
| Disk I/O (DB) | 320 IOPS | 1180 IOPS | +268% |
| Network egress (app→DB) | 12 MB/s | 38 MB/s | +217% |

### Métricas que NÃO se moveram

| Métrica | Comportamento |
|---------|---------------|
| Tráfego de entrada (RPS) | Estável; sem pico correlacionado |
| Latência de upstream pagamentos | Estável |
| Saturação de Redis | Estável |

> **Importante:** RPS estável + latência subindo é assinatura típica de **degradação do lado downstream** (DB, dependência interna), não de excesso de carga.

---

## Linha do tempo curta

| Hora (BRT) | Evento | Fonte |
|------------|--------|-------|
| 14:18:12 | p99 cruza 2000 ms (primeira anomalia) | Grafana Tempo |
| 14:18:45 | Sentinel inicia investigação automática | Sentinel |
| 14:20:02 | p99 atinge pico de 6200 ms | Grafana Tempo |
| 14:20:30 | Error rate cruza 1% | Grafana Mimir |
| 14:22:00 | Métricas começam a retornar ao baseline | (auto-recuperação) |
| 14:23:18 | p99 volta abaixo de 1500 ms | Grafana Tempo |
| 14:25:00 | Sentinel encerra investigação como "resolved naturally" | Sentinel |

---

## Hipóteses levantadas

Lista todas as hipóteses consideradas no momento da análise. Marca cada uma como confirmada, descartada ou não conclusiva.

| # | Hipótese | Status |
|---|----------|--------|
| H1 | Pico de carga (mais RPS) | **Descartada** — RPS ficou estável |
| H2 | Bug de aplicação introduzido em deploy recente | **Descartada** — último deploy 36h antes do spike |
| H3 | Query DB problemática (lock, full table scan transiente) | **Confirmada** — query lenta detectada nos logs DB |
| H4 | Saturação de Redis | **Descartada** — Redis estável |
| H5 | Problema de rede entre app e DB | **Inconclusiva** — sem evidência forte, mas latência de conexão DB subiu |

---

## Análise das hipóteses

### H3 — Query DB problemática (confirmada)

**Evidência.**

- Log de slow query no PostgreSQL às 14:18:32:

```text
duration: 4823.117 ms  statement: SELECT * FROM orders WHERE customer_id = ?
  AND created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC
```

- A query foi disparada por uma campanha de email-blast do cliente, que abriu múltiplas sessões simultâneas; cada sessão carregou "Minhas compras dos últimos 30 dias".

**Causa raiz inferida.**

- Tabela `orders` cresceu 4x nos últimos 6 meses sem revisão de índices.
- Query usa `ORDER BY created_at DESC` mas índice composto não foi criado para `(customer_id, created_at)`.
- Para customers com histórico longo, query degrada para full scan parcial.

**Por que se auto-resolveu.**

- Email-blast terminou de processar; sessões simultâneas caíram naturalmente.
- Cache de aplicação (Redis com TTL 5 min) começou a hidratar resultados frequentes.

### H5 — Rede (inconclusiva)

Aumento de network egress correlaciona com aumento de transfer de payload das queries lentas (mais linhas retornadas). Provavelmente efeito, não causa.

---

## Conclusão

**O que aconteceu.** Email-blast disparado pelo cliente às 14:15 abriu múltiplas sessões simultâneas que dispararam uma query degradada (`SELECT * FROM orders` sem índice composto). A query saturou IOPS do DB, aumentou latência da aplicação, e gerou 5 minutos de degradação até a campanha terminar.

**Houve incidente?** No limite. Error rate cruzou 1% por ~2 minutos. Alguns usuários viram timeout. Não foi declarado incidente formal porque resolveu sozinho antes do MTTD habitual; mas é um quase-acidente que merece tratamento.

**Causa raiz.** Índice composto faltando em `orders(customer_id, created_at)` + comunicação ausente entre time de growth e time de plataforma sobre janelas de campanha.

---

## Recomendações

| # | Recomendação | Prazo | Owner sugerido |
|---|--------------|-------|----------------|
| 1 | Criar índice composto `idx_orders_customer_created` em `orders(customer_id, created_at DESC)` | 7 dias | time DBA cliente |
| 2 | Adicionar regra de alerta `slow-query-detected` (query duration >2s) no Elven Observability | 14 dias | Elven |
| 3 | Estabelecer canal `#capacity-planning` entre growth e plataforma para campanhas grandes | 21 dias | time cliente |
| 4 | Revisar TTL do cache de "Minhas compras" — atualmente 5 min, pode ser 15-30 min | 30 dias | time backend cliente |
| 5 | Auditar outras queries em tabelas com crescimento recente (>2x em 6 meses) | 60 dias | time DBA cliente + Elven |

---

## Anexos

- Snapshot do dashboard "Checkout API Latency": `<URL Grafana>`.
- Slow query log do PostgreSQL: bucket `s3://elven-customer-logs/2026/03/11/postgres-slow-query/`.
- Pyroscope CPU profile da aplicação durante a janela: `/tmp/pyroscope/2026-03-11/14h.pb.gz`.
- Captura de campanha de marketing que disparou: print do Mailchimp anexado.

---

## Glossário

- **Spike** — pico anômalo e curto de métrica que pode ou não evoluir para incidente.
- **MTTD** — Mean Time To Detect.
- **Slow query log** — log do PostgreSQL que registra queries acima de um threshold de duração.
- **Sentinel** — agente automatizado da Elven Observability que correlaciona sinais e dispara investigações.
- **Email-blast** — disparo em massa de email de marketing que pode causar tráfego sincronizado.
- **IOPS** — Input/Output Operations Per Second; saturação típica em disco RDS.
