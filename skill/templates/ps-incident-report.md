---
title: Relatório de Incidente — <Cliente> — <YYYY-MM-DD>
slug: <YYYYMMDD>-relatorio-incidente-<cliente>
type: ps-incident-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
incident_id: "INC-YYYY-NNNN"
incident_date: "2026-MM-DD"
client: "<nome-do-cliente>"
severity: "<SEV1|SEV2|SEV3>"
last_reviewed: 2026-05-08
status: draft
owner: ps@elven.works
---

# Relatório de Incidente — <Cliente> — <Data>

Relatório formal de incidente entregue pela Elven Works ao cliente como parte de Professional Services. Documenta linha do tempo, impacto, causa raiz, mitigação e plano de ação.

> **Importante:** Este documento é confidencial e destina-se exclusivamente ao cliente identificado no frontmatter. Não compartilhar fora da cadeia de stakeholders autorizada.

---

## Sumário

- [Sumário executivo](#sumário-executivo)
- [Linha do tempo](#linha-do-tempo)
- [Impacto](#impacto)
- [Detecção](#detecção)
- [Mitigação e recuperação](#mitigação-e-recuperação)
- [Causa raiz](#causa-raiz)
- [Análise dos 5 porquês](#análise-dos-5-porquês)
- [Lições aprendidas](#lições-aprendidas)
- [Plano de ação](#plano-de-ação)
- [Glossário](#glossário)

---

## Sumário executivo

3-5 parágrafos curtos cobrindo:

1. **O que aconteceu** em 1 frase (ex: "Indisponibilidade do checkout entre 14h30 e 15h12 BRT em 02/03/2026").
2. **Impacto principal** em métricas de negócio (perda estimada de receita, requests perdidas, % de usuários afetados).
3. **Causa raiz resumida** (ex: "Saturação de conexões no pool do PostgreSQL após pico de tráfego não previsto").
4. **Status atual** (resolvido / mitigado / em monitoramento).
5. **Próximos passos críticos** com prazo.

> **Nota:** Esta seção é o que o stakeholder não-técnico vai ler. Seja preciso e quantificado. Sem jargão.

---

## Linha do tempo

Todos os horários em **BRT (UTC-3)**. Eventos em ordem cronológica.

| Hora | Evento | Responsável | Fonte |
|------|--------|-------------|-------|
| 14:23 | Aumento anômalo de latência p99 (>3s) detectado pela Elven Observability | Sentinel (auto) | Grafana Tempo |
| 14:30 | Início efetivo da indisponibilidade — checkout retorna 503 | (gatilho) | Status page |
| 14:31 | Alerta SEV1 disparado para canal #incidents | Elven Incident | Slack |
| 14:33 | On-call do cliente acknowledged | <nome> | OpsGenie |
| 14:35 | War room aberto (Google Meet) | <nome> | — |
| 14:42 | Hipótese 1 descartada (DNS) | <nome> | — |
| 14:55 | Causa raiz identificada — pool DB saturado | <nome> | Grafana Mimir |
| 15:01 | Mitigação aplicada — restart com pool size 200 | <nome> | kubectl |
| 15:12 | Métricas voltam ao baseline | (auto-verificação) | Grafana Mimir |
| 15:30 | War room encerrado | <nome> | — |
| 16:00 | Postmortem iniciado | <nome> | Elven Incident |

---

## Impacto

### Usuário final

- **Período de indisponibilidade total:** 14:30 – 15:12 (42 min).
- **Período de degradação parcial:** 14:23 – 14:30 e 15:12 – 15:25 (latência acima de SLA).
- **Usuários afetados:** ~<N> sessões ativas (estimativa baseada em Faro RUM).
- **Requests perdidas:** <N> (HTTP 503/504 retornados).

### Negócio

| Métrica | Valor estimado | Fonte |
|---------|----------------|-------|
| Receita não realizada | R$ <X> | Estimativa baseada em conversion rate × tráfego médio do período |
| Carrinhos abandonados | <N> | Faro session events |
| Suporte (tickets abertos) | <N> | <ferramenta> |

### Sistemas

| Sistema | Estado durante incidente | Estado pós-incidente |
|---------|--------------------------|----------------------|
| Checkout API | Indisponível (503) | Operacional |
| DB PostgreSQL | Saturado (connections exhausted) | Pool aumentado para 200 |
| Loki / Tempo / Mimir | Operacionais durante todo o período | Operacionais |

---

## Detecção

### Como o incidente foi detectado

A Elven Observability detectou aumento de latência p99 às 14:23 via regra de alerta `checkout-api-p99-latency-high`. O alerta foi roteado para o canal #incidents do Slack do cliente em 14:31.

### Tempo de detecção (MTTD)

**MTTD = 8 minutos** (entre 14:23 — primeira anomalia visível — e 14:31 — disparo do alerta).

### Análise da detecção

> **Atenção:** O MTTD ficou dentro do SLA acordado (<10 min), mas o alerta poderia ter disparado mais cedo. Recomendação: avaliar regra de error rate (HTTP 5xx) com window de 1 min em vez de 5 min, o que detectaria 503s em ~30s.

---

## Mitigação e recuperação

### Ações tomadas

1. **14:42** — Hipótese DNS descartada via `nslookup` em pods diferentes.
2. **14:50** — Hipótese de saturação de CPU descartada via `kubectl top pods`.
3. **14:55** — Painel "PostgreSQL Connections" no Grafana Mimir mostrou pool em 100/100 (saturado).
4. **15:01** — Aplicação de `kubectl patch` ajustando `connections.maxConnections: 200`.
5. **15:08** — Rolling restart concluído.
6. **15:12** — Métricas de latência e error rate voltaram ao baseline.

### Tempo de mitigação (MTTR)

**MTTR = 41 minutos** (entre 14:31 — alerta — e 15:12 — recovery).

### Tempo total (MTTF + MTTD + MTTR)

**Indisponibilidade efetiva = 42 minutos** (entre 14:30 e 15:12).

---

## Causa raiz

Texto direto e quantificado.

**Sintoma observado.** Checkout API retornou HTTP 503 entre 14:30 e 15:12.

**Cadeia técnica.**

1. Pico de tráfego não previsto no checkout (+220% acima da média do período) iniciou às 14:18.
2. Pool de conexões PostgreSQL (`max_connections: 100`) saturou em 14:23.
3. Novas requests ficaram aguardando conexão até timeout (5s), retornando 503.
4. Sem auto-scaling de conexões configurado, situação se sustentou até intervenção manual.

**Por que não houve auto-mitigação.** O serviço está atrás de HPA (Kubernetes), mas o HPA escala CPU/memory, não pool de DB. Adicionar instâncias de aplicação sem aumentar `max_connections` agravaria o problema.

**Por que o pico não estava previsto.** Campanha de marketing ativada às 14:00 pelo time de growth do cliente sem sincronização com plataforma. Tráfego subiu 4x em 15 minutos.

---

## Análise dos 5 porquês

1. **Por que houve indisponibilidade do checkout?** Porque o pool DB saturou e novas conexões caíram em timeout.
2. **Por que o pool saturou?** Porque o tráfego excedeu a capacidade configurada (`max_connections: 100`).
3. **Por que a configuração era 100?** Porque foi dimensionada em 2025 com base em tráfego médio + 50% de buffer, sem revisão após o crescimento de 2026.
4. **Por que não havia revisão automática?** Porque não havia capacity planning recorrente para o componente DB.
5. **Por que não havia capacity planning?** Porque a documentação operacional do checkout não previa pico sazonal/campanha; ownership do dimensionamento estava ambíguo.

---

## Lições aprendidas

### O que funcionou bem

- Detecção pela Elven Observability dentro do SLA (8 min).
- War room aberto rapidamente; comunicação fluiu no Slack.
- Mitigação direta e correta após causa raiz identificada.

### O que pode melhorar

- **Detecção poderia ter sido mais rápida** com regra de error rate em janela menor.
- **Capacity planning ausente** para DB — não existia procedimento recorrente.
- **Comunicação com marketing** falhou — campanhas grandes não passam por revisão de capacidade.

---

## Plano de ação

| # | Ação | Responsável | Prazo | Status |
|---|------|-------------|-------|--------|
| 1 | Aumentar `max_connections` PostgreSQL para 200 em produção | <time> | 02/03/2026 | ✓ feito |
| 2 | Implementar PgBouncer como connection pooler na frente do DB | <time> | 30/03/2026 | pendente |
| 3 | Criar regra de alerta `db-pool-saturation` (≥80% por 2 min) | Elven | 09/03/2026 | em curso |
| 4 | Reduzir janela de regra `checkout-api-error-rate` de 5 min para 1 min | Elven | 09/03/2026 | em curso |
| 5 | Documentar procedimento de capacity planning trimestral | <time> | 30/04/2026 | pendente |
| 6 | Implementar canal Slack `#capacity-planning` para campanhas marketing | <time cliente> | 16/03/2026 | pendente |

> **Nota:** Status atualizado em cada revisão deste relatório. Próxima revisão: 16/03/2026.

---

## Glossário

- **MTTD** — Mean Time To Detect; tempo entre o início real do incidente e o disparo do alerta.
- **MTTR** — Mean Time To Recovery; tempo entre o disparo do alerta e o retorno do serviço ao baseline.
- **SEV1** — Severidade 1; incidente de impacto crítico que afeta produção e exige resposta imediata.
- **Pool de conexões DB** — conjunto pré-alocado de conexões com o banco; bem dimensionado evita custos de handshake.
- **HPA** — Horizontal Pod Autoscaler; mecanismo Kubernetes que escala número de pods baseado em métricas.
- **Sentinel** — agente automatizado da Elven Observability que correlaciona sinais e dispara investigações.
