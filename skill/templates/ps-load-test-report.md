---
title: Relatório de Teste de Carga — <Cliente> — <Cenário>
slug: <YYYYMMDD>-relatorio-teste-carga-<cliente>
type: ps-load-test-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
test_date: "2026-MM-DD"
client: "<nome-do-cliente>"
scenario: "<nome-curto-do-cenário>"
target_environment: "<staging|hml|production-mirror>"
last_reviewed: 2026-05-08
status: draft
owner: ps@elven.works
---

# Relatório de Teste de Carga — <Cliente> — <Cenário>

Relatório formal de teste de carga executado pela Elven Works contra ambiente do cliente. Documenta objetivo, metodologia, resultados, bottlenecks identificados e recomendações.

> **Importante:** Este documento é confidencial. Métricas e configurações citadas refletem o ambiente alvo na data do teste; podem ter mudado desde então.

---

## Sumário

- [Sumário executivo](#sumário-executivo)
- [Objetivo do teste](#objetivo-do-teste)
- [Escopo](#escopo)
- [Metodologia](#metodologia)
- [Ambiente alvo](#ambiente-alvo)
- [Cenários executados](#cenários-executados)
- [Resultados](#resultados)
- [Análise de bottlenecks](#análise-de-bottlenecks)
- [Comparação com SLOs](#comparação-com-slos)
- [Recomendações](#recomendações)
- [Anexos](#anexos)
- [Glossário](#glossário)

---

## Sumário executivo

3-5 parágrafos curtos:

1. **O que foi testado** em 1 frase (ex: "Checkout end-to-end sob carga progressiva de 100 a 5000 RPS").
2. **Resultado headline** (ex: "Sistema sustenta 3200 RPS com p95 <800ms; degrada acima de 3500 RPS").
3. **Bottleneck principal identificado.**
4. **Comparação com objetivo declarado** (atingiu / não atingiu / parcialmente).
5. **Próximos passos críticos** com prazo.

---

## Objetivo do teste

Texto direto:

- **Hipótese a validar.** Ex: "O checkout suporta a meta de Black Friday 2026 (3000 RPS, p95 <1s)".
- **Métricas-alvo:**
  - Throughput sustentado: ≥3000 RPS
  - Latência p95: <1000 ms
  - Error rate: <0.1%
  - Saturação CPU/memória: <80%
- **Pergunta de negócio.** Ex: "Vamos passar pela Black Friday sem indisponibilidade?"

---

## Escopo

### Em escopo

- Endpoint `/api/checkout/order` (POST) — fluxo principal.
- Endpoint `/api/payments/charge` (POST) — dependência crítica.
- Conexão com DB PostgreSQL e cache Redis.

### Fora de escopo

- Caminhos de erro / chargeback (testados em fluxo separado).
- Integrações com gateways de pagamento (mockadas).
- Front-end web/mobile (cobertura de Faro Web Vitals em produção).

---

## Metodologia

### Ferramenta

| Item | Valor |
|------|-------|
| Ferramenta de carga | k6 v0.50 |
| Local de origem | EC2 t3.xlarge × 4 (us-east-1) |
| Modelo de carga | Ramp-up linear + sustained |
| Duração total | 45 min |

### Modelo de carga

```text
Fase 1 — Warm-up:    0 → 500 RPS    em 5 min
Fase 2 — Ramp:    500 → 3000 RPS    em 15 min
Fase 3 — Sustained: 3000 RPS        por 15 min
Fase 4 — Stress: 3000 → 5000 RPS    em 5 min
Fase 5 — Recovery:                  5 min idle
```

### Payload

- Body médio: 1.2 KB (JSON com 14 campos).
- Distribuição de produtos no carrinho: power-law (80% catálogo top-200).
- Geração de carga: 30% novos usuários, 70% retornantes (cookie de sessão reutilizado).

---

## Ambiente alvo

### Infra

| Componente | Configuração |
|------------|--------------|
| Cluster | EKS 1.29, region us-east-1 |
| Nodes | 6 × m5.2xlarge (8 vCPU, 32 GB) |
| Pods checkout-api | 12 réplicas, HPA 4-30, request CPU 500m |
| PostgreSQL | RDS db.r6g.4xlarge, max_connections=200 |
| Redis | ElastiCache cache.m6g.large |

### Observabilidade ativa

- Elven Observability v2.x — coleta OTLP traces/métricas/logs.
- Sentinel monitorando durante o teste; dashboards `loadtest-checkout-2026Q1` no Grafana.
- Snapshot de queries Pyroscope coletado no minuto 20 e minuto 35.

---

## Cenários executados

### Cenário 1 — Baseline (sustained 3000 RPS por 15 min)

Objetivo: confirmar capacidade nominal.

### Cenário 2 — Stress (ramp para 5000 RPS)

Objetivo: encontrar o limite de degradação.

### Cenário 3 — Endurance (3000 RPS por 60 min) — *opcional, fora deste relatório*

> **Nota:** Cenário 3 foi planejado mas adiado para a próxima janela de manutenção.

---

## Resultados

### Latência

| Percentil | Cenário 1 (baseline) | Cenário 2 (stress) | Meta | Avaliação |
|-----------|----------------------|--------------------|------|-----------|
| p50 | 180 ms | 540 ms | <500 ms | **OK** (baseline) / **NÃO OK** (stress) |
| p95 | 720 ms | 2400 ms | <1000 ms | **OK** / **NÃO OK** |
| p99 | 1200 ms | 4800 ms | <2000 ms | **OK** / **NÃO OK** |
| p99.9 | 2800 ms | 12000 ms | — | informativo |

### Throughput

- Cenário 1: 2980 RPS sustentado (target 3000; diferença <1%).
- Cenário 2: throughput máximo 3450 RPS antes de degradação; acima disso aumenta erro.

### Error rate

| Cenário | HTTP 2xx | HTTP 4xx | HTTP 5xx | Timeout |
|---------|----------|----------|----------|---------|
| Cenário 1 | 99.94% | 0.03% | 0.02% | 0.01% |
| Cenário 2 | 87.20% | 0.06% | 5.30% | 7.44% |

### Saturação de recursos (Cenário 1)

| Componente | Métrica | Valor médio | Pico |
|------------|---------|-------------|------|
| checkout-api (pods) | CPU | 62% | 78% |
| checkout-api (pods) | Memory | 51% | 60% |
| RDS PostgreSQL | CPU | 41% | 55% |
| RDS PostgreSQL | Connections | 132/200 | 178/200 |
| Redis | CPU | 12% | 18% |
| Redis | Memory | 38% | 42% |

---

## Análise de bottlenecks

### Bottleneck principal — DB connections (Cenário 2)

Acima de 3500 RPS, pool de conexões saturou (200/200) e novas requests entraram em timeout.

**Evidência (Grafana Mimir):**

```text
pg_stat_database_active_connections{datname="checkout"}
```

Curva sobe de 132 (estável) → 200 (saturação) em 90 segundos.

**Recomendação imediata.** Implementar PgBouncer com pool transaction-level entre app e RDS. Estimativa de ganho: ~2x capacidade de connections lógicas.

### Bottleneck secundário — alocação de objetos JSON (checkout-api)

Pyroscope (CPU profile no minuto 35) mostra 28% do tempo CPU em `json.Marshal`.

**Recomendação.** Avaliar pre-alocação de buffers ou troca para `jsoniter` / `ffjson`. Ganho estimado: 15-20% de capacidade adicional.

---

## Comparação com SLOs

| SLO declarado | Meta | Observado (Cenário 1) | Avaliação |
|---------------|------|------------------------|-----------|
| Disponibilidade (success rate) | 99.9% | 99.94% | **passa** |
| Latência p95 | <1000 ms | 720 ms | **passa** |
| Throughput sustentado | ≥3000 RPS | 2980 RPS | **passa** (no limite) |
| Saturação CPU pods | <80% | 78% pico | **passa** (no limite) |

> **Atenção:** Throughput e saturação CPU **no limite**. Crescimento de tráfego de 5% já estoura saturação CPU. Recomendação: ampliar HPA `max` de 30 para 50 réplicas antes de pico sazonal.

---

## Recomendações

Ordenadas por impacto e esforço.

| # | Recomendação | Impacto | Esforço | Prazo sugerido |
|---|--------------|---------|---------|----------------|
| 1 | Implementar PgBouncer | Alto | Médio | 30 dias |
| 2 | Ampliar HPA max de 30 → 50 | Médio | Baixo | 7 dias |
| 3 | Profilling de `json.Marshal` e otimização | Médio | Médio | 60 dias |
| 4 | Criar SLO formal de p99 (hoje só p95 declarado) | Médio | Baixo | 30 dias |
| 5 | Executar cenário de endurance (60 min) | Baixo | Baixo | 30 dias |

---

## Anexos

- Dashboards Grafana: `loadtest-checkout-2026Q1`, `loadtest-checkout-2026Q1-resources`.
- Scripts k6: repo `<cliente>/loadtest-checkout` branch `2026Q1`.
- Pyroscope snapshots: `/tmp/pyroscope-snapshots/2026-03-06/*.pb.gz` (anexar separadamente).
- Logs do controlador HPA durante o teste: `kubectl -n checkout describe hpa checkout-api`.

---

## Glossário

- **RPS** — Requests Per Second; carga aplicada e sustentada.
- **p95 / p99 / p99.9** — percentis de latência; p99 = 99% das requests ficam abaixo do valor.
- **HPA** — Horizontal Pod Autoscaler; mecanismo Kubernetes.
- **PgBouncer** — connection pooler entre aplicação e PostgreSQL.
- **k6** — ferramenta de load testing.
- **Pyroscope** — ferramenta de continuous profiling da Elven.
- **Endurance test** — teste sustentado por período longo (1h+) que revela leaks e degradação gradual.
