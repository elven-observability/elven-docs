---
title: Relatório de Monitoramento — Spike de Produção — <Cliente> — <YYYY-MM-DD>
slug: <YYYYMMDD>-relatorio-spike-<cliente>
type: ps-spike-report
audience: [cliente-eng, cliente-sre, cliente-stakeholder, eng-elven]
spike_date: "2026-MM-DD"
spike_window_brt: "HH:MM – HH:MM"
client: "<nome-do-cliente>"
severity_estimated: "<informativo|alerta|incidente>"
last_reviewed: 2026-05-12
status: draft
owner: ps@elven.works
---

# Relatório de Monitoramento — Spike de Produção

\<Cliente The Club\> — \<evento gatilho do spike\>
Data: \<DD de mês de YYYY\> | Horário do Pico: \<HH:MM\> BRT

> Header de página: `<Cliente> | Elven Works — Relatório de Monitoramento`.

---

## Sumário

1. Resumo Executivo
2. Preparação Realizada Antes do Pico
3. Cronologia do Spike
4. Métricas Detalhadas
5. Análise de Gargalos
6. Comportamento do HPA
7. Recomendações (Priorização)
8. Conclusão

---

## 1. Resumo Executivo

1-2 parágrafos. Padrão:

Este relatório documenta o monitoramento em tempo real do cluster \<X\> de produção durante o spike de acessos causado por \<evento gatilho\> às \<HH:MM\> BRT do dia \<DD/MM/YYYY\>. O monitoramento cobriu o período de \<HH:MM\> a \<HH:MM\> BRT, com coletas a cada \<intervalo\>.

**RESULTADO:** \<frase headline 1-linha sobre o desfecho. Padrão observado: "A infraestrutura absorveu o spike com sucesso. Apenas N erros transitórios foram registrados durante o scale-up do HPA. Zero indisponibilidade para o usuário final."\>

---

## 2. Preparação Realizada Antes do Pico

### 2.1 Escalamento Preventivo

| Componente | Antes | Depois | Observação |
|------------|-------|--------|------------|
| \<App\> (pods) | 1 réplica | 3 réplicas | HPA min=3, max=6 |
| \<Backend\> (pods) | 1 réplica | 3 réplicas | HPA min=3, max=6 |
| \<Outro componente\> (pods) | 1 réplica | 3 réplicas | Sem HPA |
| Nginx Ingress (pods) | 1 réplica | 3 réplicas | Sem HPA |
| Redis (ElastiCache) | `cache.t3.micro` | `cache.m6g.large` | Zero downtime (blue-green) |
| Nodes EKS | 5 | 8 (pré) → 11 (pico) | Cluster Autoscaler ativo, ASG max=15 |

### 2.2 Correções Aplicadas

- `SecretProviderClass redis-secrets-prod` criado (estava ausente, bloqueava deploy).
- Security Group do ElastiCache corrigido (node SG não tinha acesso à porta 6379).
- Resource requests adicionados ao `<componente>` (`cpu=250m`, `memory=256Mi`).

---

## 3. Cronologia do Spike

Tabela ampla com horário, evento, métricas-chave, erros. Cada linha = 1 minuto ou 1 evento relevante.

| Horário (BRT) | Evento | \<App\> CPU (HPA) | \<Backend\> CPU (HPA) | Nodes | Erros |
|---------------|--------|----------|------------|-------|-------|
| 13:41 | Baseline (pré-pico) | 2% | 0% | 10 | 0 |
| 13:45 | Tráfego começa a subir | 3% | 1% | 9 | 0 |
| 13:50 | Crescimento gradual | 4% | 1% | 9 | 0 |
| 13:55 | Aceleração | 6% | 1% | 9 | 0 |
| 13:57 | Ramp-up significativo | 9% | 2% | 9 | 0 |
| 13:58 | Carga intensa | 20% | 4% | 9 | 0 |
| 13:59 | Pré-pico | 39% | 8% | 9 | 0 |
| **14:00** | **PICO — HPA \<App\> atinge 122%** | **122%** | 23% | 9 | 0 |
| 14:01 | HPA escala \<App\> 3→6, 2 nodes provisionando | 94% | 15% | 11 | 1 |
| 14:02 | Novos pods absorvendo carga | 89% | 19% | 11 | 0 |
| 14:03 | Estabilizando com 6 réplicas | 55% | 14% | 11 | 0 |
| 14:04 | Carga distribuída | 37% | 13% | 11 | 0 |
| 14:05 | Normalizando | 30% | 12% | 11 | 0 |
| 14:07 | Pós-pico | 22% | 10% | 11 | 0 |
| 14:09 | HPA começa a desescalar \<App\> 6→3 | 29% | 6% | 11 | 0 |

---

## 4. Métricas Detalhadas

### 4.1 CPU por Pod — \<App\> (gargalo principal)

Comentário curto: "O \<App\> é o componente que mais consome CPU. Sem limite de CPU definido (burstable), os pods conseguiram usar mais de 1000m cada durante o pico, o que é positivo pois evitou throttling."

| Pod | Idle (13:41) | Pré-pico (13:58) | Pico (14:00) | Pós-escala (14:04) | Pós-pico (14:08) |
|-----|--------------|------------------|--------------|--------------------|--------------------|
| `<app>-2tzlm` | 47m | 216m | 1367m | 286m | 168m |
| `<app>-cg4np` | 15m | 209m | 1337m | 322m | 216m |
| `<app>-wl44j` | 7m | 197m | 1331m | 325m | 190m |
| `<app>-hr2q5` (novo) | - | - | - | 319m | 204m |
| `<app>-kf7wn` (novo) | - | - | - | 588m | 192m |
| `<app>-tkfmh` (novo) | - | - | - | 382m | - |
| **TOTAL** | **69m** | **622m** | **4035m** | **2222m** | **970m** |

### 4.2 CPU por Pod — \<Backend\>

(Mesma tabela, formato idêntico, para outros componentes relevantes.)

### 4.3 Memória — \<App\> (crescimento durante pico)

Tabela similar mostrando memória por pod ao longo da janela.

### 4.4 Nodes — Saturação durante o Pico

| Node | Tipo | CPU médio | CPU pico | Memory pico |
|------|------|-----------|----------|-------------|
| `ip-10-0-1-x` | t3.large | 45% | 78% | 62% |
| `ip-10-0-1-y` | t3.large | 38% | 71% | 58% |
| ... | ... | ... | ... | ... |

---

## 5. Análise de Gargalos

### 5.1 Gargalo #1: \<componente\> — \<dimensão\> (\<CRÍTICO|MÉDIO|BAIXO\>)

**Observação.** Texto direto: o que foi observado, com número.

**Causa.** Cadeia técnica explicando o porquê.

**Evidência.** Cite painel Grafana, query Prometheus, log line.

### 5.2 Gargalo #2: Cluster Autoscaler — Latência de Provisioning (MÉDIO)

Padrão similar.

### 5.3 Gargalo #3: Nodes com CPU limitada (MÉDIO)

Padrão similar.

### 5.4 Gargalo #4: \<componente\> (BAIXO)

Padrão similar.

### 5.5 Não-Gargalo: \<componentes que se saíram bem\>

Importante registrar o que NÃO foi problema — evita future debugging duplicado.

---

## 6. Comportamento do HPA

Tabela ou prosa explicando como o HPA reagiu, tempo de reação, oscilações observadas.

| Componente | Trigger threshold | Reação observada | Tempo de scale | Tempo de stabilização |
|------------|-------------------|------------------|----------------|------------------------|
| \<App\> | CPU >80% | Escala 3→6 em 14:01 | ~60s | ~3 min |
| \<Backend\> | CPU >70% | Não escalou (CPU max 23%) | n/a | n/a |

---

## 7. Recomendações (Priorização)

| # | Ação | Impacto | Esforço | Prioridade |
|---|------|---------|---------|------------|
| 1 | Aumentar HPA `minReplicas` para 4-5 | Alto: reduz saturação no pico | Baixo | **P0** |
| 2 | Aumentar HPA `maxReplicas` \<App\> de 6 para 10 | Alto: permite escalar mais | Baixo | **P0** |
| 3 | Implementar circuit breaker na \<dependência\> | Alto: evita 500 se Redis cair | Médio | **P1** |
| 4 | Migrar para nodes m6i.xlarge (4 vCPU) | Médio: melhor densidade e burst | Médio | **P1** |
| 5 | Avaliar Karpenter em vez de Cluster Autoscaler | Médio: provisioning 2x mais rápido | Alto | **P2** |
| 6 | Adicionar PodDisruptionBudget nos \<componentes críticos\> | Baixo: proteção contra evictions | Baixo | **P2** |
| 7 | Configurar `topologySpreadConstraints` | Baixo: distribuição entre AZs | Baixo | **P2** |
| 8 | Monitorar ElastiCache via dashboard Elven | Baixo: visibilidade | Baixo | **P3** |

---

## 8. Conclusão

1-2 parágrafos fechando. Padrão:

- O spike foi absorvido com \<resultado\>.
- Os \<N\> gargalos identificados têm mitigação clara via recomendações P0/P1.
- Próximo spike previsto: \<data ou condição\>. Re-monitorar após aplicar P0+P1.
