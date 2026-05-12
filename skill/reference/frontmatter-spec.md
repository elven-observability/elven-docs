# Frontmatter Spec — `elven-docs-skill`

Spec autoritativa do frontmatter YAML obrigatório em todo doc novo de `elven-observability/docs/`. Validado pelo lint (`scripts/lint.sh` itens 1-4).

---

## Bloco completo

```yaml
---
title: Instrumentação Java com Elven Observability
slug: instrumentacao-java
type: language-instrumentation-guide
audience: [cliente-eng, agente-ia]
product_version: "OTel Java Agent 2.x"
last_reviewed: 2026-05-08
status: stable
owner: docs@elven.works
---
```

8 campos no total: 6 obrigatórios + 2 opcionais.

---

## Campos

### `title` — string, obrigatório

Espelha exatamente o H1 do doc (sem o `# `). Se muda o H1, atualiza aqui.

```yaml
title: Instrumentação .NET com Elven Observability
```

### `slug` — string, obrigatório

Kebab-case sem acento. **DEVE ser igual ao filename sem `.md`.** Lint rejeita mismatch.

```yaml
slug: instrumentacao-dotnet     # arquivo: instrumentacao-dotnet.md ✓
```

Regras:

- Minúsculas.
- Hífen como separador.
- Sem acento (`ç` → `c`, `ã` → `a`, etc.).
- Sem espaço, underscore, ponto.

### `type` — enum, obrigatório

Um dos 9 valores válidos:

**Templates de doc técnico interno/cliente:**

| Valor | Quando usar |
|-------|-------------|
| `language-instrumentation-guide` | Instrumentação para UMA linguagem (Java, Python, .NET, Node.js, Go, …) |
| `platform-instrumentation-guide` | Instrumentação via plataforma/orquestrador (K8s Operator, Lambda layers, Serverless plugin, …) |
| `stack-installation-guide` | Cliente vai hospedar/operar componente Elven na infra dele (stack LGTM, Collector FE, Beyla standalone) |
| `frontend-sdk-guide` | SDK web/cliente cuja doc cresce em matriz framework × caso (Faro Web SDK, futuro Faro RN) |
| `pdtec-spec` | Spec curta (<300 linhas) específica de cliente PDtec |

**Templates de relatório PS (Professional Services, entregue ao cliente):**

| Valor | Quando usar |
|-------|-------------|
| `ps-incident-report` | Relatório formal de incidente: linha do tempo, impacto, causa raiz, mitigação, plano de ação |
| `ps-load-test-report` | Relatório de teste de carga: metodologia, resultados, bottlenecks, recomendações |
| `ps-comparative-report` | Comparativo entre dois cenários/versões/ambientes com decisão recomendada |
| `ps-spike-report` | Análise de spike (pico anômalo curto) que pode ou não ter virado incidente |

Lint rejeita qualquer valor fora desse enum. PS reports recebem renderização PDF temada **client** (com capa, header, footer, paginação) via `elven-docs-skill pdf <arquivo.md>`.

### `audience` — array de enum, obrigatório (≥1 item)

Pelo menos uma persona declarada. Valores válidos (ver `checklists/persona-coverage.md`):

- `cliente-eng` — engenheiro/SRE no cliente integrando.
- `cliente-sre` — SRE do cliente operando componente Elven hospedado.
- `agente-ia` — Sentinel/Claude consumindo doc como contexto.
- `eng-elven` — engenheiro Elven escrevendo/revisando.
- `onboarding-eng-elven` — pessoa nova no time Elven.

```yaml
audience: [cliente-eng, agente-ia]
```

Default por `type`:

- `language-instrumentation-guide` → `[cliente-eng, agente-ia]`
- `platform-instrumentation-guide` → `[cliente-eng, agente-ia, onboarding-eng-elven]`
- `stack-installation-guide` → `[cliente-sre, agente-ia, onboarding-eng-elven]`
- `frontend-sdk-guide` → `[cliente-eng, agente-ia]`
- `pdtec-spec` → `[cliente-eng, agente-ia]`

### `product_version` — string, opcional

Versão do produto/SDK alvo. Use quando há quebra de compatibilidade entre majors.

```yaml
product_version: "OTel Java Agent 2.x"
product_version: "Grafana Faro Web SDK v2"
product_version: "Serverless Framework v3"
```

Quando o doc é agnóstico de versão (ex: K8s Operator stable), omitir o campo.

**NUNCA** colocar versão no H1 — ver `style-guide.md` decisão E4.

### `last_reviewed` — date ISO 8601, obrigatório

Formato `YYYY-MM-DD`. Atualizar no PR. Lint emite **warning** (não erro) quando `today - last_reviewed > 180 dias` — sinaliza doc estagnado.

```yaml
last_reviewed: 2026-05-08
```

### `status` — enum, obrigatório

| Valor | Significado |
|-------|-------------|
| `draft` | Em escrita; ainda não revisado por par. NÃO publicar para cliente. |
| `stable` | Revisado, lint passando, publicável. |
| `deprecated` | Substituído por outro doc. EXIGE campo extra `replaced_by` (slug do substituto). |

Exemplo de doc deprecated:

```yaml
status: deprecated
replaced_by: instrumentacao-dotnet-v3
```

### `owner` — string, obrigatório

Email ou handle responsável. Pra routing de issues e dúvidas.

```yaml
owner: docs@elven.works
owner: time-frontend@elven.works
owner: leonardo.zwirtes@elven.works
```

---

## Ordem dos campos

A ordem **não é exigida** pelo lint (YAML é set, não lista). Mas a ordem canônica para legibilidade:

1. `title`
2. `slug`
3. `type`
4. `audience`
5. `product_version` (se presente)
6. `last_reviewed`
7. `status`
8. `replaced_by` (se status=deprecated)
9. `owner`

---

## Exemplo por tipo

### `language-instrumentation-guide`

```yaml
---
title: Instrumentação Python com Elven Observability
slug: instrumentacao-python
type: language-instrumentation-guide
audience: [cliente-eng, agente-ia]
product_version: "OpenTelemetry Python 1.x"
last_reviewed: 2026-05-08
status: stable
owner: docs@elven.works
---
```

### `platform-instrumentation-guide`

```yaml
---
title: Instrumentação Kubernetes com OpenTelemetry Operator
slug: instrumentacao-kubernetes-operator
type: platform-instrumentation-guide
audience: [cliente-eng, agente-ia, onboarding-eng-elven]
last_reviewed: 2026-05-08
status: stable
owner: time-platform@elven.works
---
```

(sem `product_version` — Operator é Elven-mantido, evolui contínuo.)

### `stack-installation-guide`

```yaml
---
title: Instalação da Stack de Observabilidade no Kubernetes
slug: instalacao-stack-observabilidade-kubernetes
type: stack-installation-guide
audience: [cliente-sre, agente-ia, onboarding-eng-elven]
product_version: "Helmfile baseline 2026-Q2"
last_reviewed: 2026-05-08
status: stable
owner: time-platform@elven.works
---
```

### `frontend-sdk-guide`

```yaml
---
title: Instrumentação Frontend com Grafana Faro Web SDK
slug: faro-sdk-instrumentacao-frontend
type: frontend-sdk-guide
audience: [cliente-eng, agente-ia]
product_version: "Grafana Faro Web SDK v2"
last_reviewed: 2026-05-08
status: stable
owner: time-frontend@elven.works
---
```

### `pdtec-spec`

```yaml
---
title: PDtec — Variáveis de Ambiente ECS
slug: pd-tec-variaveis-ecs
type: pdtec-spec
audience: [cliente-eng, agente-ia]
last_reviewed: 2026-05-08
status: stable
owner: docs@elven.works
---
```

### `ps-incident-report`

```yaml
---
title: Relatório de Incidente — Beyond — 2026-03-02
slug: 20260302-relatorio-incidente-beyond
type: ps-incident-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
incident_id: "INC-2026-0023"
incident_date: "2026-03-02"
client: "Beyond"
severity: "SEV1"
last_reviewed: 2026-03-09
status: stable
owner: ps@elven.works
---
```

Campos adicionais opcionais para PS reports:

- `incident_id` (ps-incident-report) — ID de rastreamento.
- `incident_date` / `test_date` / `spike_date` / `report_date` — data do evento.
- `client` — nome do cliente; usado na capa do PDF.
- `severity` (ps-incident-report) — `SEV1` | `SEV2` | `SEV3`.
- `severity_estimated` (ps-spike-report) — `informativo` | `alerta` | `incidente`.
- `scenario` (ps-load-test-report) — nome do cenário.
- `target_environment` (ps-load-test-report) — `staging` | `hml` | `production-mirror`.
- `baseline_label` / `comparison_label` (ps-comparative-report) — descrições curtas dos cenários.

### `ps-load-test-report`

```yaml
---
title: Relatório de Teste de Carga — Beyond — 2026-Q1
slug: 20260306-relatorio-teste-carga-beyond
type: ps-load-test-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
test_date: "2026-03-06"
client: "Beyond"
scenario: "checkout-bf-2026"
target_environment: "production-mirror"
last_reviewed: 2026-03-08
status: stable
owner: ps@elven.works
---
```

### `ps-comparative-report`

```yaml
---
title: Relatório Comparativo — Beyond — Beyond2 vs HML
slug: 20260310-relatorio-comparativo-beyond2-vs-hml
type: ps-comparative-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
report_date: "2026-03-10"
client: "Beyond"
baseline_label: "HML atual (Stack v1.4.0)"
comparison_label: "Beyond v2 (Stack v2.0.0-rc.3)"
last_reviewed: 2026-03-10
status: stable
owner: ps@elven.works
---
```

### `ps-spike-report`

```yaml
---
title: Relatório de Spike — Beyond — 2026-03-11 14:18 BRT
slug: 20260311-relatorio-spike-beyond
type: ps-spike-report
audience: [cliente-stakeholder, cliente-eng, cliente-sre, eng-elven]
spike_date: "2026-03-11"
spike_window_brt: "14:18 – 14:23"
client: "Beyond"
severity_estimated: "alerta"
last_reviewed: 2026-03-11
status: stable
owner: ps@elven.works
---
```

---

## Migração retroativa (Fase 7)

Os 12 docs legados não têm frontmatter. Migração via `scripts/backfill-frontmatter.sh`:

```bash
elven-docs-skill backfill /Users/leonardozwirtes/Documents/Elven/elven-observability/docs/*.md
```

Script deriva:

- `title` ← extraído do primeiro `# ` do arquivo.
- `slug` ← `basename(file, .md)`.
- `type` ← heurística por nome:
  - `pd-tec-*` → `pdtec-spec`
  - `instrumentacao-{java,python,nodejs,dotnet}` → `language-instrumentation-guide`
  - `instrumentacao-{kubernetes-operator,lambda-manual,serverless-plugin}` → `platform-instrumentation-guide`
  - `instalacao-*` ou `collector-*` → `stack-installation-guide`
  - `faro-sdk-*` → `frontend-sdk-guide`
  - `*-relatorio-incidente-*` → `ps-incident-report`
  - `*-relatorio-teste-carga-*` → `ps-load-test-report`
  - `*-relatorio-comparativo-*` → `ps-comparative-report`
  - `*-relatorio-spike-*` → `ps-spike-report`
- `audience` ← default do `type`.
- `last_reviewed` ← `git log -1 --format=%ad --date=short -- <file>`.
- `status` ← `stable`.
- `owner` ← `docs@elven.works` (revisar manualmente no PR).

Backfill é mecânico; revisor humano confirma `type` e `audience` no PR.
