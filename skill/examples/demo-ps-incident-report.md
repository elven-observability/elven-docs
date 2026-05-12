---
title: Relatório de Incidente — TestCo — 2026-03-02
slug: demo-ps-incident-report
type: ps-incident-report
audience: [cliente-eng, cliente-sre, cliente-stakeholder, eng-elven]
incident_id: "INC-2026-DEMO-001"
incident_date: "2026-03-02"
client: "TestCo"
severity: "SEV2"
last_reviewed: 2026-05-12
status: stable
owner: ps@elven.works
---

# War Room — Análise de Lentidão | 02/03/2026 ~10h

> Exemplo demonstração — dados sintéticos com estrutura idêntica a PS reports reais Beyond. Use como referência viva ao escrever um `ps-incident-report` novo.

---

## Sumário

1. Informações da Sessão
2. Timeline do Incidente
3. Causa Raiz
4. Queries — CloudWatch Logs Insights
5. Recomendação

---

## 1. Informações da Sessão

| Campo | Valor |
|-------|-------|
| Data/Hora | 02/03/2026 a partir das 09:41 BRT |
| Usuário | `+5511999000001` |
| Trace ID | `5f8d2a17-9b3e-4c12-a888-1234567890ab` |
| Title ID | 9999 |
| Member ID | 8888 |
| Ambiente | Produção (`testco-prod`) |
| Log Group | `/aws/containerinsights/testco-eks-pro/application` |

---

## 2. Timeline do Incidente

| Horário (BRT) | Evento |
|---------------|--------|
| 09:41:27 | Login iniciado — SMS enviado via Twilio (POST `v2/Services/.../Verifications`) |
| 09:41:39 | SMS verificado (POST `v2/Services/.../VerificationCheck`) |
| 09:41:39 | Token Firebase gerado (Title: 9999, Member: 8888) |
| 09:41:45 | Usuário acessa tela de feature X — início das chamadas ao backend interno |
| 09:41:47 → 09:42:16 | `AuthClient` disparando POST `auth/phone` a cada ~300–400ms continuamente |
| 10:00:24 | Primeiro `TaskCanceledException` — POST `auth/phone` começa a estourar timeout |
| 10:00:24 → 10:29:26 | Cascata de falhas em todas as chamadas (`ListItems`, `GetCoupons`, `GetBenefits`) |

---

## 3. Causa Raiz

### 3.1 Ausência de cache de token no AuthClient

O `AuthClient` realiza `POST auth/phone` no backend interno a cada chamada individual, sem reaproveitar o token entre as chamadas. Quando o usuário acessa as telas de feature X, o controller dispara múltiplas chamadas:

- `ListItems` — para cada `memberId` (8888, 7777, 6666, 5555…)
- `GetCoupons` — para cada combinação de dia e tag (FeatureX, BookingA, OptionB, TierC, TierD…)
- `GetBenefits`

Cada uma dessas chamadas autentica de forma independente via `POST auth/phone`, gerando estresse no endpoint de autenticação do backend.

### 3.2 Volume de chamadas detectado

| Métrica | Valor |
|---------|-------|
| Total de chamadas AuthClient na sessão | ~886 |
| Intervalo entre chamadas | ~300–400ms |
| Duração do período degradado | ~48 minutos (09:41 → 10:29 BRT) |

### 3.3 Endpoints afetados

| Rota | Controller |
|------|------------|
| `GET /api/v1/feature-x/status` | `FeatureXController.GetStatus` |
| `GET /api/v1/feature-x/intervals` | `FeatureXController.GetIntervals` |

### 3.4 Padrão de erro

```text
TaskCanceledException: The operation was canceled.

→ ExternalServiceException: Error on communication with endpoint auth/phone

→ RpcException: StatusCode="Cancelled", Detail="Call canceled by the client."

→ Unhandled exception: GetStatus / GetIntervals
```

### 3.5 Conclusão

O gargalo não é infraestrutura (RDS, EKS, rede). O problema é arquitetural no `AuthClient`: ele reautentica via `POST auth/phone` em cada sub-request, sem cache do token. Com múltiplos requests do controller de feature X, o endpoint `auth/phone` do backend interno foi saturado, ficou lento e passou a recusar conexões com timeout — derrubando todas as funcionalidades dependentes.

---

## 4. Queries — CloudWatch Logs Insights

Log Group: `/aws/containerinsights/testco-eks-pro/application`

Janela de tempo sugerida: 02/03/2026 das 09:30 às 10:30 (BRT)

### 4.1 Todos os logs do número de telefone

```text
fields @timestamp, @message
| filter @message like /11999000001/
| sort @timestamp asc
| limit 1000
```

### 4.2 Todos os logs do trace ID

```text
fields @timestamp, @message
| filter @message like /5f8d2a17-9b3e-4c12-a888-1234567890ab/
| sort @timestamp asc
| limit 1000
```

### 4.3 Apenas erros e warnings do trace ID

```text
fields @timestamp, @message
| filter @message like /5f8d2a17-9b3e-4c12-a888-1234567890ab/
| filter @message like /\[ERR\]/ or @message like /\[WRN\]/
| sort @timestamp asc
| limit 500
```

### 4.4 Contar chamadas AuthClient (volume de autenticações)

```text
fields @timestamp, @message
| filter @message like /5f8d2a17-9b3e-4c12-a888-1234567890ab/
| filter @message like /AuthClient/ and @message like /Payload/
| stats count() as total_chamadas
```

### 4.5 Apenas os erros de timeout (TaskCanceledException)

```text
fields @timestamp, @message
| filter @message like /5f8d2a17-9b3e-4c12-a888-1234567890ab/
| filter @message like /TaskCanceledException/
| sort @timestamp asc
| limit 500
```

### 4.6 Visão geral — erros por minuto no período

```text
fields @timestamp, @message
| filter @message like /11999000001/
| filter @message like /\[ERR\]/
| stats count() as erros by bin(1m)
| sort @timestamp asc
```

---

## 5. Recomendação

O `AuthClient` precisa cachear o token de autenticação por sessão ou por pipeline de request, em vez de autenticar a cada chamada individual. Isso eliminaria o stress no endpoint `auth/phone` do backend interno e reduziria drasticamente a latência nas telas de feature X. Há também a necessidade de melhorar a performance do backend interno sob condições de stress durante aumento de tráfego.
