---
title: Relatório Comparativo — <Cliente> — <A> vs <B>
slug: <YYYYMMDD>-relatorio-comparativo-<cliente>-<a>-vs-<b>
type: ps-comparative-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
report_date: "2026-MM-DD"
client: "<nome-do-cliente>"
baseline_label: "<A — descrição curta>"
comparison_label: "<B — descrição curta>"
last_reviewed: 2026-05-08
status: draft
owner: ps@elven.works
---

# Relatório Comparativo — <Cliente> — <A> vs <B>

Relatório formal entregue pela Elven Works comparando dois cenários, versões, ambientes ou configurações. Documenta metodologia, métricas em paralelo, análise do delta e conclusão.

> **Importante:** Este documento é confidencial. Os números refletem condições da coleta; podem variar em produção real.

---

## Sumário

- [Sumário executivo](#sumário-executivo)
- [Pergunta sob comparação](#pergunta-sob-comparação)
- [Cenários A e B](#cenários-a-e-b)
- [Metodologia](#metodologia)
- [Métricas lado a lado](#métricas-lado-a-lado)
- [Análise do delta](#análise-do-delta)
- [Trade-offs identificados](#trade-offs-identificados)
- [Recomendação](#recomendação)
- [Anexos](#anexos)
- [Glossário](#glossário)

---

## Sumário executivo

3-5 parágrafos:

1. **O que foi comparado** (ex: "Cluster Beyond v2 vs ambiente HML atual").
2. **Resultado principal** em 1 frase quantitativa (ex: "Beyond v2 entrega -42% de latência p95 com +18% de custo computacional").
3. **Decisão recomendada** (adotar A / adotar B / aguardar mais dados).
4. **Riscos da decisão.**
5. **Próximo passo crítico.**

---

## Pergunta sob comparação

Texto direto:

- **Pergunta de negócio.** Ex: "Migrar para Beyond v2 vale o investimento adicional de 18% em compute?"
- **Hipótese sob teste.** Ex: "Beyond v2 entrega ganho de latência > 30% suficiente para justificar custo extra."
- **Critério de decisão.** Ex: "Adotar Beyond v2 se p95 cair >30% E custo total não subir >25%."

---

## Cenários A e B

### Cenário A — <Baseline>

| Aspecto | Valor |
|---------|-------|
| Nome curto | <ex: HML atual> |
| Versão / config | <ex: Stack v1.4.0> |
| Infra | <ex: 6 nodes m5.2xlarge> |
| Período de coleta | <ex: 04/03/2026 a 06/03/2026> |
| Carga aplicada | <ex: tráfego espelhado de produção, 80%> |

### Cenário B — <Comparação>

| Aspecto | Valor |
|---------|-------|
| Nome curto | <ex: Beyond v2> |
| Versão / config | <ex: Stack v2.0.0-rc.3> |
| Infra | <ex: 6 nodes m6i.2xlarge + Beyond features ON> |
| Período de coleta | <ex: 04/03/2026 a 06/03/2026> |
| Carga aplicada | <ex: idêntica ao Cenário A — espelho do mesmo tráfego> |

> **Importante:** A carga aplicada nos dois cenários precisa ser comparável; senão a comparação é inválida. Aqui usou-se traffic shadowing em paralelo durante a mesma janela.

---

## Metodologia

### Como a comparação foi feita

1. Traffic shadowing aplicado: requests reais de produção foram espelhados em paralelo para Cenário B durante 48h.
2. Métricas coletadas pela Elven Observability em ambos os ambientes simultaneamente.
3. Dashboards Grafana com painéis lado a lado (datasource diferente por cenário).
4. Janela de comparação: 48 horas (sex 04/03 18:00 → dom 06/03 18:00).
5. Janela de análise: 24 horas centrais (sáb 05/03 00:00 → dom 06/03 00:00) — exclui ramp-up de shadow e warm-up.

### O que NÃO foi feito (limitações)

- **Não houve teste de stress.** Comparação reflete carga normal de produção, não pico.
- **Não foi avaliado** comportamento sob falha (chaos engineering).
- **Custo de migração** não está incluído (apenas custo operacional contínuo).

---

## Métricas lado a lado

### Latência (p50, p95, p99)

| Métrica | Cenário A | Cenário B | Delta | Avaliação |
|---------|-----------|-----------|-------|-----------|
| p50 | 320 ms | 180 ms | **-44%** | melhora significativa |
| p95 | 1240 ms | 720 ms | **-42%** | melhora significativa |
| p99 | 2800 ms | 1380 ms | **-51%** | melhora significativa |
| p99.9 | 8200 ms | 3100 ms | **-62%** | melhora significativa |

### Throughput

| Métrica | Cenário A | Cenário B | Delta |
|---------|-----------|-----------|-------|
| RPS sustentado | 2400 | 2400 | 0% (idêntico, por design do shadow) |
| Capacidade pico observada | 3200 | 4100 | **+28%** |

### Error rate

| Métrica | Cenário A | Cenário B | Delta |
|---------|-----------|-----------|-------|
| HTTP 5xx % | 0.08% | 0.03% | **-62%** |
| Timeouts % | 0.04% | 0.01% | **-75%** |

### Custo

| Componente | Cenário A | Cenário B | Delta |
|------------|-----------|-----------|-------|
| Compute (EC2/EKS) | $4200/mês | $4960/mês | **+18%** |
| Storage (Loki/Tempo/Mimir) | $1800/mês | $2400/mês | **+33%** |
| Egress (rede) | $400/mês | $480/mês | **+20%** |
| **Total** | **$6400/mês** | **$7840/mês** | **+22.5%** |

### Recursos

| Métrica | Cenário A | Cenário B | Delta |
|---------|-----------|-----------|-------|
| CPU médio (app) | 61% | 48% | **-21%** |
| CPU médio (DB) | 38% | 41% | **+8%** |
| Memory médio | 54% | 52% | **-4%** |

---

## Análise do delta

### Ganhos relevantes (Cenário B)

1. **Latência reduzida em ~42-51%** em todos os percentis. Atribuível a:
   - Otimizações de path interno no Beyond v2.
   - Cache de tracing melhorado (menos overhead de instrumentação).
   - Instâncias m6i com clock mais alto que m5.

2. **Error rate caiu ~62-75%.** Origem provável: novo retry interno no Beyond v2 mascara timeouts transientes que antes vazavam para o cliente.

3. **Capacidade de pico +28%.** Cenário B comporta picos sem degradação visível em p95.

### Custos relevantes (Cenário B)

1. **+22.5% em custo total.** Compute +18%, storage +33% (mais sinais coletados), egress +20%.
2. **CPU do DB +8%** — Beyond v2 aplica mais pressão no DB devido a paralelismo aumentado.

### Onde A é equivalente ou melhor que B

- Memória ligeiramente melhor em B (-4%) mas insignificante.
- Não há métrica onde A supera B materialmente.

---

## Trade-offs identificados

| Trade-off | Implicação |
|-----------|------------|
| Latência ↓ vs custo ↑ | Para casos com SLA de latência rigoroso, B compensa. Para casos com pressão de custo, A se sustenta. |
| Coleta de sinais ↑ vs storage ↑ | B coleta 30% mais dados; storage segue. Pode-se reduzir retenção pra equilibrar. |
| DB CPU ↑ no B | Pode exigir upgrade de instância DB no longo prazo. |

---

## Recomendação

> **Decisão recomendada.** Adotar Cenário B (Beyond v2) em produção.

**Justificativa.**

- Critério de decisão estabelecido era "p95 cair >30% E custo total não subir >25%".
- Resultado: p95 caiu **-42%** (passa) e custo subiu **+22.5%** (passa).
- Ambos critérios atendidos.

**Plano de migração sugerido.**

1. **Semana 1.** Migrar 10% do tráfego para Beyond v2 (canário).
2. **Semana 2.** Monitorar; expandir para 50% se métricas seguirem o observado.
3. **Semana 3-4.** Expandir para 100%; deprecar Cenário A.
4. **Semana 5.** Revisar custo de DB; avaliar upgrade se CPU sustentar >50%.

**Riscos da decisão.**

- **Tráfego real de pico** pode comportar-se diferente do espelho. Mitigar com canário (passo 1).
- **Custo de storage** pode escalar mais que o esperado se sinais novos forem retidos no padrão de 30d. Mitigar ajustando retenção.
- **Beyond v2** ainda em release candidate (RC.3). Aguardar GA é uma opção mais conservadora.

---

## Anexos

- Dashboards Grafana: `comparativo-beyond-v2-vs-hml-2026Q1`.
- Logs do shadow proxy: bucket `s3://elven-loadtest-logs/2026/03/beyond-comparison/`.
- Pyroscope snapshots para ambos cenários: `/tmp/pyroscope/2026-03-05/`.
- Configurações exatas usadas: arquivos `helmfile.cenario-a.yaml` e `helmfile.cenario-b.yaml` no repo `<cliente>/infra-comparison`.

---

## Glossário

- **Traffic shadowing** — técnica que copia requests reais e envia em paralelo a um ambiente alternativo, sem afetar resposta ao usuário.
- **p95 / p99 / p99.9** — percentis de latência.
- **Canário** — rollout gradual que envia uma fração pequena de tráfego para a versão nova.
- **GA** — General Availability; release estável.
- **RC** — Release Candidate; candidato a GA.
- **Beyond v2** — versão next-gen da plataforma Elven Observability (referência depende do contexto do cliente).
