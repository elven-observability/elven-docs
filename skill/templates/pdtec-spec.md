---
title: PDtec — <Tópico curto>
slug: pd-tec-<topico>
type: pdtec-spec
audience: [cliente-eng, agente-ia]
last_reviewed: 2026-05-08
status: draft
owner: docs@elven.works
---

# PDtec — <Tópico curto>

Spec técnica curta para o cliente PDtec. Foco em **referência rápida** e **copy-paste**.

> **Nota:** Este documento cobre apenas <delimite escopo: ex: alteração no Dockerfile / variáveis ECS / endpoint X>. Outras configurações estão em outros docs `pd-tec-*.md`.

---

## Como funciona

(Substitua por `## Placeholders` se este doc é tabela-only.)

Explicação curta (3-5 parágrafos) do mecanismo. Pode citar lib `elven-unified-observability-py` ou similar.

```bash
# exemplo mínimo
```

---

## Passo a passo

(Substitua por `## Variáveis ECS (Task Definition)` se este doc é tabela JSON.)

Sequência numerada de 3-5 passos. Cada passo:

### Passo 1 — <ação>

```dockerfile
# trecho a adicionar/modificar
```

> **Atenção:** observação operacional importante.

### Passo 2 — <ação>

(...)

### Passo 3 — <ação>

(...)

---

## Exemplos completos

(Substitua por `## Referência rápida` se este doc é tabela.)

Exemplos prontos por caso de uso comum no PDtec.

### FastAPI

```dockerfile
FROM python:3.12-slim

RUN pip install elven-unified-observability-py fastapi uvicorn
COPY . /app
WORKDIR /app

ENTRYPOINT ["elven-unified-observability", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

### Django

```dockerfile
# variante para Django
```

### Celery worker

```dockerfile
# variante para Celery
```

---

## Checklist de deploy

(Opcional — apenas em PDtec que documenta procedimento, não tabela pura.)

- [ ] Dockerfile alterado com `elven-unified-observability` no entrypoint.
- [ ] Task Definition ECS com 24 variáveis (ver `pd-tec-variaveis-ecs.md`).
- [ ] Tenant e token Loki configurados via Secrets Manager.
- [ ] DNS do collector externo (`otel-{ambiente}-ext.pd.tec.br`) acessível pela VPC.
- [ ] Smoke test após deploy: 1 request gera trace no Tempo Elven.

---

## Troubleshooting

### Logs não aparecem no Loki

**Sintoma.** Aplicação roda, traces aparecem, mas logs ausentes.

**Causa provável.** `LOKI_TENANT` ou `LOKI_TOKEN` ausentes/incorretos.

**Fix.**

1. Verifique env do task: `aws ecs describe-tasks --task <task-arn>`.
2. Confirme que `logs-interceptor-python` foi instalado pela lib unificada.
3. Cheque conectividade outbound da VPC para `loki.elvenobservability.com`.

### Wrapper `elven-unified-observability` falha no startup

**Sintoma.** Container morre logo após start; logs do CloudWatch mostram traceback Python.

**Causa provável.** Versão da lib incompatível com runtime Python.

**Fix.**

1. Confirme Python `>= 3.10` no Dockerfile base.
2. Verifique versão da lib em `pip list | grep elven-unified-observability`.
3. Reinstale fixando versão major suportada.
