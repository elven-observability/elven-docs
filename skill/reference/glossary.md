# Glossário Elven

Termos técnicos da Elven Works que aparecem nos docs do repo `elven-observability/docs`. Glossário **autoritativo**: ao escrever doc novo, use estas grafias e acepções; não invente sinônimos.

> Glossário v1 cobre apenas o que aparece literalmente no repo. Termos de produtos internos não-públicos (Sentinel, Kyrvex, Wevy, etc., se existirem) ficam fora até serem documentados publicamente.

---

## Sumário

- [Produtos e componentes Elven](#produtos-e-componentes-elven)
- [Stack subjacente](#stack-subjacente)
- [Conceitos de instrumentação](#conceitos-de-instrumentação)
- [Domínios e endpoints](#domínios-e-endpoints)
- [Convenção de placeholders](#convenção-de-placeholders)
- [Termos a evitar](#termos-a-evitar)

---

## Produtos e componentes Elven

### Elven Observability

Plataforma SaaS de observabilidade da Elven Works. Stack LGTM gerenciada (Loki, Grafana, Tempo, Mimir) + camada Elven de autenticação, multi-tenancy, billing, alerting. **Sempre escrita assim** ("Elven Observability", duas palavras, capitalizadas).

### Collector FE

Serviço que recebe dados de observabilidade frontend (via Grafana Faro Web SDK) e encaminha para o Grafana Loki. **Implantado na infraestrutura do cliente**, não na Elven. A Elven fornece credenciais do Loki e participa do deploy.

Grafia: "Collector FE" (não "FE Collector", "Frontend Collector", "collector frontend").

### Elven Plugin

Plugin do Serverless Framework que injeta a instrumentação Elven em funções AWS Lambda. Aparece em `instrumentacao-serverless-plugin.md`.

### Loki / Tempo / Mimir Elven

Backends LGTM da Elven. Quando referenciados como destino de envio:

- "Elven Loki" — para logs.
- "Elven Tempo" — para traces.
- "Elven Mimir" — para métricas.

Endpoints documentados em [Domínios e endpoints](#domínios-e-endpoints).

### `elven-unified-observability-py`

Lib Python que unifica `opentelemetry-instrumentation-py` + `logs-interceptor-python` em um wrapper único com CLI `elven-unified-observability`. Documentada em `pd-tec-instrumentacao.md`.

### `elven-credentials`

Credenciais OTLP/Loki fornecidas pela Elven ao cliente. Inclui `tenant_id`, `api_token`, e endpoints específicos.

---

## Stack subjacente

### LGTM

Acrônimo: **L**oki + **G**rafana + **T**empo + **M**imir. Stack open-source da Grafana Labs que a Elven Observability gerencia. Quando mencionado, sem precisar expandir após a primeira ocorrência no doc.

### OpenTelemetry

Convenção neutra a fornecedor para coleta de telemetria. Stack subjacente que a Elven adota end-to-end. **Sempre "OpenTelemetry"** (uma palavra, OTel é OK como abreviação após primeira ocorrência).

### OTLP

OpenTelemetry Protocol. Protocolo binário/HTTP para envio de traces, métricas, logs. Aparece em endpoints (`OTEL_EXPORTER_OTLP_ENDPOINT`).

### Grafana Faro

SDK web da Grafana Labs para Real User Monitoring (RUM). Captura Web Vitals, erros JS, sessões, eventos. Versão atual: **v2** (GA em novembro 2025). v3 não existe ainda.

### Grafana Beyla

Auto-instrumentação eBPF da Grafana Labs. Mencionado como alternativa em alguns guias da Elven mas não tem doc dedicado v1.

---

## Conceitos de instrumentação

### Zero-code instrumentation

Instrumentação que não exige alteração no código da aplicação. Aplicada via runtime agent (Java agent, .NET profiler), Kubernetes Operator, ou Lambda layer. Termo canônico: **"zero-code"** com hífen.

### Instrumentação automática (auto-instrumentação)

Sinônimo de zero-code para frameworks específicos. Ex: "auto-instrumentação para Spring Boot", "auto-instrumentação para Express". OK usar tanto "instrumentação automática" quanto "auto-instrumentação".

### Instrumentação manual / programática

Adicionar spans, métricas, atributos via código da aplicação. Use a primeira para clientes; "programática" é mais técnica e cabe em headings de variante.

### Auto-instrumentation

Forma em inglês. **Não usar** em texto pt-BR; traduzir para "instrumentação automática" ou "zero-code".

### Resource attributes

Metadados que identificam o serviço emissor (service.name, service.version, deployment.environment). **Não traduzir** — termo OTel padrão.

### Sampling

Decisão de manter ou descartar spans. **Não traduzir** — termo OTel padrão.

### Sinais (signals)

Os 3 tipos de telemetria OTel: traces, métricas, logs. Padrão Elven: "modo Elven, **logs, métricas e traces** ficam sempre ligados".

### Tenant / multi-tenant

Cliente isolado dentro do SaaS Elven. Cada tenant tem `tenant_id`, credenciais próprias, quotas. **Não traduzir.**

### PDtec

Cliente específico da Elven. Aparece como prefixo de docs (`pd-tec-*.md`) e em domínios (`*.pd.tec.br`). Grafia: **"PDtec"** (P maiúsculo, D maiúsculo, "tec" minúsculo, sem espaço).

---

## Domínios e endpoints

Domínios documentados no repo:

| Domínio | Função |
|---------|--------|
| `loki.elvenobservability.com` | Endpoint Loki Elven (logs) |
| `monitoring.elven.works` | Console/UI da Elven Observability |
| `otel-ext.pd.tec.br` | Collector externo PDtec (produção) |
| `otel-stg-ext.pd.tec.br` | Collector externo PDtec (staging) |
| `otel-dev-ext.pd.tec.br` | Collector externo PDtec (dev) |
| `collector-fe.<dominio-cliente>` | Collector FE no cliente (placeholder) |
| `otel-collector.<infra-cliente>` | OTel Collector no cliente (placeholder) |

Endpoints OTLP padrão da Elven seguem o template:

```
https://otel-{ambiente}.{produto}.{dominio-cliente}
```

---

## Convenção de placeholders

Placeholders em exemplos de configuração devem seguir 1 dos 2 estilos:

### Estilo A: Variável de ambiente shell

```
${ELVEN_TENANT}
${ELVEN_TOKEN}
${COLLECTOR_ENDPOINT}
${SERVICE_NAME}
${REGIAO}
${STAGE}
```

ALL CAPS, prefixo `$` e chaves. Use quando o placeholder vai virar env var no deploy.

### Estilo B: Substituição inline

```
{produto}
{ambiente}
{tenant}
{loki_tenant}
{loki_token}
{container_name}
{stage}
{region}
```

Lowercase, sem `$`. Use quando o placeholder vai ser substituído no momento da geração do doc/config (ex: "substitua `{produto}` pelo nome do seu produto").

### Estilo C: Marcador uppercase com angle brackets (legado)

```
<SEU_TENANT_ID>
<SEU_API_TOKEN>
```

Aparece em alguns docs antigos. **Em docs novos, prefira Estilo A ou B.** Use C apenas quando portando exemplo de fornecedor terceiro que usa essa convenção.

---

## Termos a evitar

| Evitar | Use | Por quê |
|--------|-----|---------|
| "monitoring" puro | "observabilidade" | Elven é plataforma de observabilidade, não monitoramento |
| "métrica de Prometheus" | "métrica" (e linkar pra config Prometheus quando aplicável) | Stack é Mimir-compatível, Prometheus é detalhe de implementação |
| "incident" | "incidente" | pt-BR completo |
| "endpoint OTel" | "endpoint OTLP" | OTel é a especificação, OTLP é o protocolo |
| "agent" | "agente" ou nome específico (Java agent, OpenTelemetry Operator) | Genérico demais |
| "FID" (Web Vitals) | "INP" | Faro v2 removeu FID; INP é o substituto |
| "tracing" como substantivo geral | "rastreamento distribuído" ou "traces" | "tracing" puro é vago |
| "alertar" / "alertas" indiscriminado | "alerta" (singular) ou nomear regra específica | Diferenciar regra vs ocorrência |

---

## Termos sob avaliação (não usar até decisão)

Termos que apareceram em discussões internas mas **NÃO** estão documentados publicamente. Não use em docs até que sejam adicionados a este glossário com fonte:

- "Sentinel" / "Sentinel v2"
- "Kyrvex"
- "Wevy"
- "Elven Connect"

Se você precisa documentar algum desses, abra issue antes para discutir grafia, escopo, e quem é o owner.
