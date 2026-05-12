# Glossário Elven

Termos técnicos da Elven Works que aparecem (a) no repo `elven-observability/docs` e (b) no site público `docs.elven.works`. Glossário **autoritativo**: ao escrever doc novo, use estas grafias e acepções; não invente sinônimos.

> Glossário v2 (skill v0.2.0) cobre o ecossistema completo Elven Works conforme [docs.elven.works](https://docs.elven.works/). Pontos com lacuna (Sentinel, Kyrvex, etc.) permanecem em [Termos sob avaliação](#termos-sob-avaliacao).

---

## Produtos top-level Elven Works

A plataforma Elven Works tem **4 produtos** documentados publicamente:

| Produto | Função | Doc oficial |
|---------|--------|-------------|
| **Elven Monitoring** | Monitoramento de infraestrutura, aplicações, serviços (web/API, SSL, sintético, browser check, infra) | [docs.elven.works/elven-platform/elven-monitoring](https://docs.elven.works/elven-platform/elven-monitoring.md) |
| **Elven Observability** | Coleta e análise de traces, métricas, logs via OTel + stack LGTM | [docs.elven.works/elven-platform/elven-observability](https://docs.elven.works/elven-platform/elven-observability.md) |
| **Elven Incident** | Gestão centralizada de incidentes, alertas, status pages, postmortem, on-call | [docs.elven.works/elven-platform/elven-incident](https://docs.elven.works/elven-platform/elven-incident.md) |
| **Command Center** | Centro de controle com acionamentos, runbooks, relatórios | [docs.elven.works/elven-platform/command-center](https://docs.elven.works/elven-platform/command-center.md) |

Quando o doc trata de mais de um produto, mencione todos por nome próprio (ex: "Elven Observability + Elven Incident").

---

## Módulos Elven Monitoring

| Módulo | Função |
|--------|--------|
| Web/API | Monitoramento HTTP/HTTPS de endpoints específicos (GET, POST) |
| Domínios/SSL | Validade de certificado e expiração de domínio |
| Sintético | Testes sintéticos de disponibilidade (uptime check) |
| Browser Check | Experiência real-user via browser headless |
| Infraestrutura | Servidores e recursos (CPU, memória, disco) |

---

## Módulos Elven Incident

| Módulo | Função |
|--------|--------|
| Alertas | Configuração e gestão de regras de alerta |
| Incidentes | Rastreamento de incidentes (linha do tempo, severidade, status) |
| Status Pages | Páginas de status público para comunicação ao usuário final |
| Postmortem | Análise post-incidente colaborativa (Summary / Root Cause / Recovery / Corrective Actions) |
| Escala de Plantão (on-call) | Gestão de rotação on-call |
| Integrações de canais | Slack, Teams, Discord, Google Chat, E-mail, SMS, WhatsApp, ligações |

---

## Módulos Command Center

| Módulo | Função |
|--------|--------|
| Runbooks | Procedimentos automatizados acionáveis |
| Relatórios | Geração de relatórios operacionais |

---

> Acima é a **taxonomia oficial**. Quando uma feature não cabe em nenhum módulo listado, escale antes de inventar nome novo.

---

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

## Termos sob avaliação (não usar até decisão) {#termos-sob-avaliacao}

Termos que apareceram em discussões internas mas **NÃO** estão documentados publicamente em [docs.elven.works](https://docs.elven.works/). Não use em docs até que sejam adicionados a este glossário com fonte:

- "Sentinel" / "Sentinel v2" — agente de correlação automática (apareceu em apresentação interna; sem doc público)
- "Kyrvex"
- "Wevy"
- "Elven Connect"
- "Beyond v2" — referência interna a uma evolução da plataforma; usar apenas em docs de cliente específico que já tem o termo (ex: cliente "Beyond")

Se você precisa documentar algum desses, abra issue antes para discutir grafia, escopo, e quem é o owner.

---

## Terminologia de PS reports

Termos próprios dos relatórios de Professional Services entregues ao cliente:

- **PS** — Professional Services. Categoria interna Elven que cobre relatórios, assessoria, roadmap.
- **MTTD** — Mean Time To Detect. Tempo entre início real do incidente e disparo do alerta.
- **MTTR** — Mean Time To Recovery. Tempo entre alerta e retorno do serviço ao baseline.
- **SEV1 / SEV2 / SEV3** — Severidade declarada de incidente. SEV1 = crítico (afeta produção, exige resposta imediata).
- **Spike** — Pico anômalo curto que pode ou não virar incidente.
- **Endurance test** — Teste de carga sustentado por período longo (1h+) que revela memory leaks e degradação gradual.
- **Traffic shadowing** — Espelhamento de tráfego real para ambiente alternativo sem afetar resposta ao usuário.
- **Canário (canary)** — Rollout gradual que envia uma fração pequena de tráfego pra versão nova.
- **5 porquês (5 whys)** — Técnica de análise de causa raiz que pergunta "por quê?" sucessivamente.
- **SLO** — Service Level Objective. Meta interna mensurável (ex: p95 <1s).
- **SLA** — Service Level Agreement. Compromisso contratual com o cliente.
