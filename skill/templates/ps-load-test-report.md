---
title: Relatório de Teste de Carga — <Cliente> — <Cenário>
slug: <YYYYMMDD>-relatorio-teste-carga-<cliente>
type: ps-load-test-report
audience: [cliente-eng, cliente-sre, cliente-stakeholder, eng-elven]
test_date: "2026-MM-DD"
client: "<nome-do-cliente>"
scenario: "<nome-curto-do-cenário>"
target_environment: "<dev|hml|production-mirror>"
report_version: "1.0"
last_reviewed: 2026-05-12
status: draft
owner: ps@elven.works
---

# Relatório de Teste de Carga (\<Ferramenta, ex: K6\>) — <Cliente> — <Fluxo>

> Header de página: `<Cliente> | Elven Works — Relatório de Teste de Carga`.
> Versionamento de relatório vai no título quando há iterações: `v2.0 — Inclui Teste 4 (pós-otimizações)`.

---

## Sumário

1. Resumo Executivo
2. Escopo e Metodologia
3. Infraestrutura de Teste
4. Resultados dos Testes
5. Gargalo Principal: \<componente identificado\>
6. Gargalo Secundário: \<endpoint ou componente secundário\>
7. Problemas de Infraestrutura \<ambiente\>
8. Recomendações
9. Próximos Passos
10. Conclusão

---

## 1. Resumo Executivo

1-3 parágrafos. Padrão:

1. **O que foi feito** — frase direta (ex: "Foram realizados testes de carga no fluxo X utilizando K6, simulando até 850 VUs simultâneos.").
2. **Objetivo** — em 1 linha.
3. **Resultado headline** — quantificado, citando o gargalo principal identificado (ex: "Principal gargalo: pool de conexões SQL Server (~500). Acima de ~500 VUs, satura e causa timeouts em cascata").
4. **Pista de contraste** — onde NÃO foi gargalo (ex: "Endpoints que não dependem do Multiclubes como `/cms/news` mantiveram 95%+ de sucesso, sugerindo backend específico").

---

## 2. Escopo e Metodologia

### 2.1 Fluxo Testado

Lista numerada com endpoints reais.

1. **Etapa 1 — Login.** `send-sms` → `verify-sms` → Firebase token exchange.
2. **Etapa 2 — Home do App.** `GET /schedules`.
3. **Etapa 3 — Home do Surf.** `GET /schedules/surf`, `/cms/news`, `/inscriptions`, `/schedules/surf/status` (paralelo).
4. **Etapa 4 — Seleção de Membro e Data.** `GET /members`, `/schedules/surf/dates`, `/schedules/surf/intervals`.
5. **Etapa 5 — Criação de Agendamento.** `POST /schedules/surf`.

### 2.2 Configuração do K6

Executor: `ramping-vus` com N estágios:

- 0 a 200 VUs em 2 minutos (ramp-up gradual)
- 200 a 500 VUs em 3 minutos
- 500 a 850 VUs em 3 minutos
- 850 VUs sustentados por 5 minutos
- 850 a 0 VUs em 2 minutos (ramp-down)
- Duração total: 15 minutos

### 2.3 Otimizações do Script

- **Token caching.** Login realizado 1x por VU; token reutilizado nas iterações seguintes.
- **Think time** de 1-3s entre etapas (simula comportamento real).
- **`send-sms` aceita status 400** (rate limiting por telefone) como resposta válida.

### 2.4 Dados de Teste

\<N\> usuários de teste carregados via CSV (\<origem\>). Cada VU recebe usuário único baseado no VU ID. Código SMS fixo (mock) para ambiente de teste.

---

## 3. Infraestrutura de Teste

### 3.1 Ambiente \<plataforma, ex: EKS Dev\>

Cluster: `<cluster-name>` (AWS account `<account-id>`, `<region>`).

| Recurso | Original | Load Test |
|---------|----------|-----------|
| \<App\> pods | 1 (HPA min=1, max=3) | 6 (HPA min=6, max=10) |
| \<Backend\> pods | 1 (HPA min=1, max=3) | 3 (HPA min=1, max=3) |
| Database | \<spec inicial\> | \<spec durante teste\> |
| Nodes EKS | \<N\> | \<M\> |

### 3.2 K6 Load Test Runner

| Item | Valor |
|------|-------|
| Instância | EC2 c5.2xlarge (8 vCPU, 16GB RAM) — mesma VPC |
| K6 Version | 1.6.1 |
| Load Balancer alvo | NLB interno (\<dns-name\>) |

### 3.3 Imagens Utilizadas

| Componente | Imagem | Tag |
|------------|--------|-----|
| \<App\> | `<ecr-repo>/app` | `<git-sha>` |
| \<Backend\> | `<ecr-repo>/backend` | `<git-sha>` |

---

## 4. Resultados dos Testes

### 4.1 Métricas Gerais (ou Comparação entre Testes, se múltiplas rodadas)

| Métrica | Teste 1 | Teste 2 | Teste 3 | Delta T2→T3 |
|---------|---------|---------|---------|-------------|
| Total de Requests | 146.140 | 138.220 | 152.870 | +11% |
| Throughput (req/s) | 157 | 149 | 165 | +11% |
| Iterações Completas | 111.568 | 105.310 | 119.840 | +14% |
| Max VUs Atingidos | 850 | 850 | 850 | = |
| Duração Total | 15m 30s | 15m 28s | 15m 25s | ~= |
| Error rate | 39.86% | 31.10% | 23.65% | -24% |

### 4.2 Latência por Etapa

| Etapa | p50 | p95 | p99 | Avaliação |
|-------|-----|-----|-----|-----------|
| Login | 180 ms | 720 ms | 1200 ms | OK |
| Home | 240 ms | 980 ms | 2100 ms | OK |
| Surf Home (paralelo) | 380 ms | 2400 ms | 4800 ms | **NÃO OK** |
| Seleção | 220 ms | 1100 ms | 2800 ms | OK |
| Agendamento | 510 ms | 1840 ms | 3200 ms | atenção |

### 4.3 Taxa de Sucesso por Endpoint

| Endpoint | Sucesso | OK / Falha |
|----------|---------|------------|
| `POST /send-sms` | 99% | ~13k / ~2 |
| `POST /verify-sms` | 6% | ~786 / ~12k |
| `GET /schedules` | 99% | ~5.4k / ~54 |
| `GET /schedules/surf/status` | 30% | ~3.1k / ~7.2k |
| `POST /schedules/surf` | 100% | ~4.8k / 0 |

### 4.4 Thresholds (Critérios de Aceite)

| Critério | Meta | Observado | Resultado |
|----------|------|-----------|-----------|
| Sucesso geral ≥95% | 95% | 76.35% | **Falha** |
| p95 geral <2s | <2s | 4.2s | **Falha** |
| Erro por endpoint <5% | <5% | 23.65% | **Falha** |

---

## 5. Gargalo Principal: \<componente identificado\>

### 5.1 Sintoma

Texto direto. "Acima de \<N\> VUs, \<componente\> apresenta \<sintoma observável\>."

### 5.2 Causa Raiz

Explique a cadeia técnica. Cite logs, configurações, evidências.

### 5.3 Evidência dos Logs

```text
2026-03-07T14:32:18 ERROR Could not obtain connection from pool
  HikariPool-1.PoolBase: Connection is not available, request timed out after 30000ms
```

---

## 6. Gargalo Secundário: \<endpoint ou componente\>

### 6.1 Causa

(Padrão similar à seção 5 mas mais curto.)

---

## 7. Problemas de Infraestrutura \<ambiente\>

### 7.1 \<problema observado durante o teste, ex: Imagens não disponíveis no ECR\>

Detalhamento do issue + impacto + mitigação aplicada.

---

## 8. Recomendações

### 8.1 Críticas (\<área\>)

1. **Aumentar Max Pool Size do SQL Server** de 500 para 1000.
2. **Implementar query timeout** explícito de 5s nas queries críticas.
3. **Adicionar índice composto** em `<tabela>(coluna1, coluna2)`.

### 8.2 Importantes (\<área\>)

1. \<ação\>
2. \<ação\>

### 8.3 Infraestrutura para Produção

1. Aumentar HPA `maxReplicas` do \<App\> de 10 para 20.
2. Migrar nodes EKS para m6i.xlarge (melhor IPC).

---

## 9. Próximos Passos

Lista numerada de ações concretas com owner.

1. **Time \<X\>:** Aumentar Max Pool Size do SQL Server e aplicar otimizações de query.
2. **Time \<Y\>:** Implementar cache para `/schedules/surf/status` e paralelizar chamadas.
3. **Time Elven + Time Cliente:** Re-executar teste de carga após otimizações para validar melhoria.

---

## 10. Conclusão

1-2 parágrafos fechando. Pode incluir:

- Status geral (aprovado / aprovado com ressalvas / reprovado).
- O que mudou face às rodadas anteriores (se houver).
- Próxima rodada de teste prevista.
