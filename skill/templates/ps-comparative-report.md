---
title: Comparativo — <Cliente> — <A> vs <B>
slug: <YYYYMMDD>-relatorio-comparativo-<cliente>-<a>-vs-<b>
type: ps-comparative-report
audience: [cliente-eng, cliente-sre, cliente-stakeholder, eng-elven]
report_date: "2026-MM-DD"
client: "<nome-do-cliente>"
baseline_label: "<A — descrição curta>"
comparison_label: "<B — descrição curta>"
last_reviewed: 2026-05-12
status: draft
owner: ps@elven.works
---

# Comparativo de \<dimensão\>: \<A\> vs \<B\>

> Header de página: `<Cliente> | Elven Works — Relatório de Teste de Carga` (ou similar).
> Subtítulo: condições do teste (data, ferramenta, configuração).

---

## Sumário

1. Contexto
2. Visão Geral
3. \<Dimensão 1, ex: Taxa de Sucesso por Endpoint\>
4. \<Dimensão 2, ex: Quantidade de Requests por Endpoint\>
5. \<Dimensão 3, ex: Tempos de Resposta por Etapa do Fluxo\>
6. \<Foco específico, ex: Endpoint Crítico: /schedules/surf/status\>
7. Conclusão

---

## 1. Contexto

1-2 parágrafos. Padrão:

> Este relatório compara os resultados de \<O QUE\> executados contra dois \<O QUÊ\>:

- **\<A\>:** \<descrição completa, host, account, data do teste\>.
- **\<B\>:** \<descrição completa, host, account, data do teste\>.

Ambos os testes utilizaram a mesma configuração: \<configuração relevante, ferramenta, base de dados, infra, script\>. Identidade de carga garantida por \<método: traffic shadowing / replay de CSV / mesmo runner\>.

---

## 2. Visão Geral

Tabela primária com **3 colunas** (A | B | Diferença), métricas agregadas:

| Métrica | \<A\> | \<B\> | Diferença |
|---------|-------|-------|-----------|
| Total de requests | 86.061 | 66.334 | -23% |
| Throughput (req/s) | 93.4 | 71.4 | -24% |
| Iterações completas | 18.639 | 16.335 | -12% |
| Iterações interrompidas | 331 | 512 | +55% |
| Iterações/s | 20.2 | 17.6 | -13% |
| error_rate | 17.96% | 23.10% | +5.1pp |
| http_req_failed | 38.77% | 46.95% | +8.2pp |
| checks_succeeded | 79.74% | 73.45% | -6.3pp |
| HTTP p95 (geral) | 33.23s | 50.9s | +53% |
| HTTP p95 (sucesso) | 21.23s | 39.14s | +84% |
| HTTP avg (geral) | 5.97s | 8.82s | +48% |
| HTTP avg (sucesso) | 4.7s | 9.29s | +98% |
| Data received | 259 MB | 228 MB | -12% |
| Data sent | 83 MB | 59 MB | -29% |

> **Padrão de leitura.** "O \<B\> apresentou desempenho \<adjetivo\> ao \<A\>: \<delta1\> menos requests, throughput \<delta2\> menor, tempos de resposta \<delta3\> mais lentos."

---

## 3. Taxa de Sucesso por Endpoint

Tabela ampliada com 5 colunas (Endpoint | A Sucesso | A OK/Falha | B Sucesso | B OK/Falha | Delta).

| Endpoint | \<A\> Sucesso | \<A\> OK / Falha | \<B\> Sucesso | \<B\> OK / Falha | Delta |
|----------|----|----|----|----|----|
| `POST /send-sms` | 99% | ~13k / ~2 | 99% | 13.011 / 2 | = |
| `POST /verify-sms` | 6% | ~786 / ~12k | 6% | 786 / 12.225 | = |
| `GET /schedules` | 99% | ~5.4k / ~54 | 99% | 4.564 / 44 | = |
| `GET /schedules/surf` | 99% | ~5.3k / ~53 | 98% | 4.315 / 64 | -1pp |
| `GET /cms/news` | 98% | ~5.3k / ~106 | 98% | 4.325 / 54 | = |
| `GET /inscriptions` | 98% | ~5.3k / ~106 | 96% | 4.213 / 166 | -2pp |
| `GET /schedules/surf/status` | 57% | ~3.1k / ~2.3k | 40% | 1.789 / 2.590 | -17pp |
| `GET /members` | 99% | ~5.3k / ~53 | 99% | 4.333 / 30 | = |
| `POST /schedules/surf` | 100% | ~4.8k / 0 | 100% | ~4.1k / 0 | = |

> Pp = "percentage points". Use quando diferença é em pontos percentuais, não percentual relativo.

> A maioria dos endpoints tem taxa de sucesso similar (98-99%). A diferença mais expressiva está em \<endpoint específico\> (\<-Xpp\>).

---

## 4. Quantidade de Requests por Endpoint

Volume total por endpoint, com diferença absoluta + relativa.

| Endpoint | \<A\> Requests | \<B\> Requests | Diferença | Diferença (abs) |
|----------|-----|-----|-----|-----|
| `POST /send-sms` | ~13.000 | 13.013 | ~= | - |
| `POST /verify-sms` | ~13.000 | 13.011 | ~= | - |
| `GET /schedules` | ~5.450 | 4.608 | -15% | -842 |
| `GET /schedules/surf` | ~5.350 | 4.379 | -18% | -971 |
| `GET /cms/news` | ~5.350 | 4.379 | -18% | -971 |
| `GET /inscriptions` | ~5.350 | 4.379 | -18% | -971 |

> Interpretação típica: "\<A\> processou consistentemente mais requests porque VUs completam iterações mais rápido quando os tempos de resposta são menores."

---

## 5. Tempos de Resposta por Etapa do Fluxo

| Etapa | \<A\> p95 | \<A\> avg | \<B\> p95 | \<B\> avg | Delta p95 |
|-------|------|------|------|------|------|
| Login | 720 ms | 320 ms | 980 ms | 410 ms | +36% |
| Home | 1100 ms | 480 ms | 1420 ms | 580 ms | +29% |
| Surf Home | 2400 ms | 980 ms | 3100 ms | 1240 ms | +29% |

---

## 6. Endpoint Crítico: \<endpoint específico\>

Quando há um endpoint que concentra a maior parte da diferença, dedicar uma seção a ele.

**Sintoma.** \<endpoint\> tem \<X\%\> sucesso em \<A\> vs \<Y\%\> em \<B\> (-\<Zpp\>).

**Métricas detalhadas:**

| Métrica | \<A\> | \<B\> | Delta |
|---------|------|------|-------|
| Total de chamadas | 5.420 | 4.379 | -19% |
| Sucessos | 3.089 | 1.789 | -42% |
| Falhas | 2.331 | 2.590 | +11% |
| p95 latência | 4.2s | 8.7s | +107% |

**Hipótese.** \<causa provável baseada em logs/profiling\>.

**Evidência.** \<log line, query result, etc.\>

---

## 7. Conclusão

2-3 parágrafos fechando. Padrão:

1. **Síntese do delta.** "\<A\> entregou desempenho superior em \<dimensões\>. \<B\> ficou atrás em \<dimensões\>."
2. **Causa raiz do delta (se identificável).**
3. **Recomendação.** Adotar \<A\>/\<B\>, ou continuar usando os dois com critério explícito. Próximo passo concreto.
