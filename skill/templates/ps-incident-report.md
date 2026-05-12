---
title: Relatório de Incidente — <Cliente> — <YYYY-MM-DD>
slug: <YYYYMMDD>-relatorio-incidente-<cliente>
type: ps-incident-report
audience: [cliente-eng, cliente-sre, cliente-stakeholder, eng-elven]
incident_id: "INC-YYYY-NNNN"
incident_date: "2026-MM-DD"
client: "<nome-do-cliente>"
severity: "<SEV1|SEV2|SEV3>"
last_reviewed: 2026-05-12
status: draft
owner: ps@elven.works
---

# <Título descritivo curto, ex: War Room — Análise de Lentidão> | <DD/MM/YYYY> ~HH h

> Header de página é injetado pelo PDF render: `<Cliente> | Elven Works — Relatório de Incidente`.

---

## Sumário

1. Informações da Sessão
2. Timeline do Incidente
3. Causa Raiz
4. Queries — Loki / CloudWatch Logs Insights
5. Recomendação

---

## 1. Informações da Sessão

Contexto técnico capturado para reprodução / investigação posterior. Tabela 2 colunas, sem TOC.

| Campo | Valor |
|-------|-------|
| Data/Hora | DD/MM/YYYY a partir das HH:MM BRT |
| Usuário | <telefone, email ou ID — anonimize se necessário> |
| Trace ID | `<trace-id-do-tempo>` |
| Title ID / Member ID | `<IDs internos do cliente>` |
| Ambiente | Produção (\<cluster\>) |
| Log Group | `/aws/containerinsights/<cluster>/application` |

> **Importante:** Inclua trace ID, member/customer IDs e log group **literais** — esses campos são os ganchos pra reproduzir investigação. Se houver PII, mascarar (`***95585`).

---

## 2. Timeline do Incidente

Cronológica, BRT, 1 evento por linha. Pode ser longa (10-50 linhas em incidentes maiores).

| Horário (BRT) | Evento |
|---------------|--------|
| 09:41:27 | Login iniciado — SMS enviado via Twilio (POST `v2/Services/.../Verifications`) |
| 09:41:39 | SMS verificado (POST `v2/Services/.../VerificationCheck`) |
| 09:41:39 | Token Firebase gerado (Title: 13288, Member: 13623) |
| 09:41:45 | Usuário acessa tela de surf — início das chamadas ao MultiClubes |
| 09:41:47 → 09:42:16 | MCAuthClient disparando POST `auth/phone` a cada ~300–400ms continuamente |
| 10:00:24 | Primeiro `TaskCanceledException` — POST `auth/phone` começa a estourar timeout |
| 10:00:24 → 10:29:26 | Cascata de falhas em todas as chamadas (ListInscriptions, GetVouchers, GetBenefits) |

> Use `→` para intervalos. Cite endpoint/operação literal, não descrição genérica.

---

## 3. Causa Raiz

### 3.1 <Sintoma técnico identificado em 1 frase>

Texto direto explicando o que aconteceu no nível de código/configuração. Cite arquivo/lib/componente envolvido.

```text
exemplo de stack trace ou config relevante
```

### 3.2 Volume / magnitude

Quantifique. Tabela.

| Métrica | Valor |
|---------|-------|
| Total de chamadas \<componente\> na sessão | ~886 |
| Intervalo entre chamadas | ~300–400ms |
| Duração do período degradado | ~48 minutos (HH:MM → HH:MM BRT) |

### 3.3 Endpoints / componentes afetados

| Rota | Controller / Componente |
|------|-------------------------|
| `GET /api/v1/schedules/surf/status` | `SchedulesSurfController.GetScheduleStatus` |
| `GET /api/v1/schedules/surf/intervals` | `SchedulesSurfController.GetPackageIntervals` |

### 3.4 Padrão de erro

Stack trace ou cadeia de exceção que se repete:

```text
TaskCanceledException: The operation was canceled.

→ ExternalServiceException: Error on communication with endpoint auth/phone

→ RpcException: StatusCode="Cancelled", Detail="Call canceled by the client."

→ Unhandled exception: GetScheduleStatus / GetPackageIntervals
```

### 3.5 Conclusão

1-2 parágrafos diretos isolando a causa raiz lógica do diagnóstico técnico.

> **Padrão.** "O gargalo não é \<X\>. O problema é \<Y\> em \<componente\>." Termine com a relação causa→efeito explícita.

---

## 4. Queries — Loki / CloudWatch Logs Insights

Queries verbatim que o cliente pode rodar para reproduzir / continuar investigação.

### 4.1 <Todos os logs do número de telefone / customer>

```text
fields @timestamp, @message
| filter @message like /+5511998955585/
| sort @timestamp asc
```

### 4.2 <Todos os logs do trace ID>

```text
fields @timestamp, @message
| filter @message like /87b2cb14-319a-4a1e-be8a-5e6bf9993e26/
| sort @timestamp asc
```

### 4.3 Apenas erros e warnings do trace ID

```text
fields @timestamp, @message
| filter @message like /87b2cb14/ and (@message like /Error/ or @message like /Warning/)
| sort @timestamp asc
```

### 4.4 Contar chamadas \<componente\> (volume de autenticações)

```text
fields @timestamp, @message
| filter @message like /MCAuthClient/
| stats count() by bin(1m)
```

### 4.5 Apenas erros de timeout

```text
fields @timestamp, @message
| filter @message like /TaskCanceledException/
| sort @timestamp asc
```

### 4.6 Visão geral — erros por minuto no período

```text
fields @timestamp, @message
| filter @message like /Error/
| stats count() as erros by bin(1m)
| sort @timestamp asc
```

> **Nota.** As queries acima são CloudWatch Logs Insights. Para Loki (Elven Observability), traduza usando `{namespace="<cluster>"} |~ "<pattern>"`. Mantenha as queries reais; não generalize com `<placeholder>`.

---

## 5. Recomendação

Texto direto sem cerimônia. 1-3 parágrafos. Sem tabela de plano de ação formal a menos que faça sentido.

Padrão observado nos relatórios reais:

- **Problema raiz é \<X\>.**
- **Próximo passo concreto:** \<ação técnica específica, ex: implementar cache de token no MCAuthClient com TTL de 5 min e refresh assíncrono\>.
- **Esforço estimado:** \<P0/P1/P2 ou prazo em dias\>.
- **Validação proposta:** \<como medir que melhorou — ex: re-rodar mesma sessão e verificar que `MCAuthClient` cai de 886 para <10 chamadas\>.

Se houver mais de 1 recomendação:

| # | Ação | Prioridade | Esforço |
|---|------|-----------|---------|
| 1 | <ação técnica> | P0 | Baixo |
| 2 | <ação> | P1 | Médio |
| 3 | <ação> | P2 | Alto |
