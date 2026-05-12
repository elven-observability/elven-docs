# Canonical Section Headings

Vocabulário fechado de headings H2/H3 por template. Lint rejeita variações fora dessa lista (ex: "Quick start" minúsculo, "Índice" em template language-instrumentation-guide).

---

## Headings universais

Aparecem em ≥1 template. Nome canônico exato:

| H2 canônico | Tipo de conteúdo | Templates que exigem |
|-------------|------------------|----------------------|
| `## Sumário` | Lista de links âncora dos H2 do doc | Todos exceto `frontend-sdk-guide` (usa `Índice`) e `pdtec-spec` curto |
| `## Índice` | Idem `Sumário` (apenas frontend) | `frontend-sdk-guide` |
| `## Visão geral` | O que o doc cobre, valor pro cliente | Todos exceto `pdtec-spec` |
| `## Arquitetura` | Diagrama Mermaid + descrição da topologia | `platform-instrumentation-guide`, `stack-installation-guide`, `frontend-sdk-guide` |
| `## Pré-requisitos` | Versões mínimas, acessos, dependências | Todos |
| `## Quick Start` | Caminho mais curto pra resultado funcional | `language-`, `platform-`, `stack-installation-` |
| `## Configuração` | Variáveis, opções, customização | Todos exceto `pdtec-spec` (usa `## Variáveis ECS`) |
| `## Validação ponta a ponta` | Como verificar que está funcionando | `language-`, `platform-` |
| `## Validação após a instalação` | Idem, contexto de instalação | `stack-installation-` |
| `## Troubleshooting` | Sintoma → causa → fix | Todos exceto `pdtec-spec` curto |
| `## FAQ` | Perguntas frequentes do cliente | Recomendado em todos exceto `pdtec-spec` |
| `## Veja também` | Links pra docs irmãos | Recomendado quando há cross-ref |

---

## Headings específicos por template

### `language-instrumentation-guide`

Ordem canônica:

1. `## Sumário`
2. `## Visão geral`
3. `## Pré-requisitos`
4. `## Caminho recomendado` (árvore zero-code vs programático)
5. `## Quick Start` ou `## Quick Start — <variante>` (1 ou mais; quando múltiplos, usar em-dash)
6. `## Pacotes disponíveis`
7. `## Configuração por variáveis de ambiente`
8. `## Logs e correlação com Loki`
9. `## Traces manuais, erros e atributos semânticos`
10. `## Métricas manuais`
11. `## Instrumentações automáticas`
12. `## Privacidade e dados sensíveis`
13. `## Validação ponta a ponta`
14. `## Troubleshooting`
15. `## FAQ`

### `platform-instrumentation-guide`

1. `## Sumário`
2. `## Visão geral`
3. `## Quando usar este guia` (fronteira com outros guias)
4. `## Arquitetura`
5. `## Pré-requisitos`
6. `## Quick Start`
7. `## Instalação passo a passo`
8. `## Configuração`
9. `## Controle por <unidade>` (deployment/namespace/função/task — varia por plataforma)
10. `## Validação ponta a ponta`
11. `## Troubleshooting`
12. `## FAQ`
13. `## Veja também` (recomendado)

### `stack-installation-guide`

1. `## Sumário`
2. `## Visão geral`
3. `## Arquitetura`
4. `## O que <componente> instala/coleta`
5. `## Pré-requisitos`
6. `## Antes de começar` (tenant, token, DNS)
7. `## Quick Start`
8. `## Instalação passo a passo`
9. `## O que pode ser customizado`
10. `## Como funciona` (opcional, conceitual)
11. `## Validação após a instalação`
12. `## Atualização`
13. `## Remoção`
14. `## Troubleshooting`
15. `## Checklist final` (lista `- [ ]`)
16. `## Veja também`

### `frontend-sdk-guide`

1. `## Índice` (não `Sumário` — exceção desta família)
2. `## Visão geral`
3. `## O que o SDK captura`
4. `## Instalação`
5. `## Configuração base`
6. Por framework, em H2:
   - `## React`
   - `## Next.js`
   - `## Angular`
   - `## Vue.js`
   - `## Vanilla JavaScript / HTML`
   (incluir só os que se aplicam; H3 internos para variantes — Router v6/v7, App Router/Pages Router, etc.)
7. `## OpenTelemetry Tracing`
8. `## Identificação do usuário logado`
9. `## Privacidade e dados sensíveis`
10. `## Troubleshooting`
11. `## FAQ`

### `pdtec-spec`

Estrutura curta. TOC opcional. Headings flexíveis em torno do tópico, mas escolha entre os pares:

- `## Como funciona` OU `## Placeholders` (tabela de variáveis no início)
- `## Passo a passo` OU `## Variáveis ECS (Task Definition)` (bloco JSON copy-paste)
- `## Exemplos completos` OU `## Referência rápida`
- `## Checklist de deploy` (lista `- [ ]`) — opcional
- `## Troubleshooting` (sintoma → causa → fix) — recomendado

### PS reports — padrão derivado de PDFs reais

**Padrão crítico observado em todos os 7 PDFs reais entregues a cliente Beyond:**

- **Sumário** é H2 = lista NUMERADA estática (não TOC com links âncora). Reflete sumário impresso de relatório, não navegação web.
- **Headings de seção têm numeração decimal embarcada.** `## 1. Resumo Executivo`, `### 2.1 Fluxo Testado`. Lint v0.3.0 valida que pelo menos um H2 segue esse padrão.
- **NÃO usar:** "Sumário Executivo" (real usa "Resumo Executivo"), "Análise dos 5 porquês", "Glossário" no fim, "Plano de Ação" como tabela formal.
- **Persona técnica primária.** PDFs são deep-dives técnicos com queries CloudWatch/Loki/Prometheus, tabelas extensas de métricas por pod. Stakeholder lê o `## 1. Resumo Executivo` apenas.

### `ps-incident-report`

Ordem canônica (rígida), modelo Beyond:

1. `## Sumário` (lista numerada das seções)
2. `## 1. Informações da Sessão` (tabela: Data/Hora, Usuário, Trace ID, Title/Member ID, Ambiente, Log Group)
3. `## 2. Timeline do Incidente` (tabela cronológica BRT)
4. `## 3. Causa Raiz`
   - `### 3.1 <sintoma técnico>`
   - `### 3.2 Volume / magnitude` (tabela quantificada)
   - `### 3.3 Endpoints / componentes afetados`
   - `### 3.4 Padrão de erro` (stack trace ou cadeia de exceção)
   - `### 3.5 Conclusão`
5. `## 4. Queries — Loki / CloudWatch Logs Insights` (6+ queries reproduzíveis)
6. `## 5. Recomendação`

### `ps-load-test-report`

Ordem canônica (rígida), modelo Beyond:

1. `## Sumário`
2. `## 1. Resumo Executivo`
3. `## 2. Escopo e Metodologia`
   - `### 2.1 Fluxo Testado`
   - `### 2.2 Configuração do K6`
   - `### 2.3 Otimizações do Script`
   - `### 2.4 Dados de Teste`
4. `## 3. Infraestrutura de Teste`
   - `### 3.1 Ambiente <plataforma>`
   - `### 3.2 K6 Load Test Runner`
   - `### 3.3 Imagens Utilizadas`
5. `## 4. Resultados dos Testes`
   - `### 4.1 Métricas Gerais`
   - `### 4.2 Latência por Etapa`
   - `### 4.3 Taxa de Sucesso por Endpoint`
   - `### 4.4 Thresholds (Critérios de Aceite)`
6. `## 5. Gargalo Principal: <componente>` (com 5.1 Sintoma / 5.2 Causa Raiz / 5.3 Evidência dos Logs)
7. `## 6. Gargalo Secundário: <componente>`
8. `## 7. Problemas de Infraestrutura <ambiente>`
9. `## 8. Recomendações` (subseções por prioridade: Críticas / Importantes / Infraestrutura)
10. `## 9. Próximos Passos`
11. `## 10. Conclusão`

### `ps-comparative-report`

Ordem canônica (rígida), modelo Beyond:

1. `## Sumário`
2. `## 1. Contexto`
3. `## 2. Visão Geral` (tabela: Métrica | A | B | Diferença)
4. `## 3. <Dimensão 1, ex: Taxa de Sucesso por Endpoint>`
5. `## 4. <Dimensão 2, ex: Quantidade de Requests por Endpoint>`
6. `## 5. <Dimensão 3, ex: Tempos de Resposta por Etapa do Fluxo>`
7. `## 6. <Foco específico, ex: Endpoint Crítico: /schedules/surf/status>` (quando há endpoint que concentra delta)
8. `## 7. Conclusão`

### `ps-spike-report`

Ordem canônica (rígida), modelo Beyond:

1. `## Sumário`
2. `## 1. Resumo Executivo` (com "RESULTADO:" em bold inline)
3. `## 2. Preparação Realizada Antes do Pico`
   - `### 2.1 Escalamento Preventivo` (tabela: Componente | Antes | Depois | Observação)
   - `### 2.2 Correções Aplicadas` (lista de fixes)
4. `## 3. Cronologia do Spike` (tabela ampla: Horário | Evento | métricas-chave | Erros)
5. `## 4. Métricas Detalhadas`
   - `### 4.1 CPU por Pod — <componente principal>`
   - `### 4.2 CPU por Pod — <outro componente>`
   - `### 4.3 Memória — <componente>`
   - `### 4.4 Nodes — Saturação`
6. `## 5. Análise de Gargalos`
   - `### 5.1 Gargalo #1: <componente> (CRÍTICO|MÉDIO|BAIXO)`
   - `### 5.2 Gargalo #2: ...`
   - `### 5.X Não-Gargalo: <componentes que se saíram bem>`
7. `## 6. Comportamento do HPA` (tabela)
8. `## 7. Recomendações (Priorização)` (tabela: # | Ação | Impacto | Esforço | Prioridade P0-P3)
9. `## 8. Conclusão`

---

## Regra de "Não se aplica"

Se uma seção obrigatória pelo template não se aplica ao seu doc específico, **NÃO REMOVA o heading**. Mantenha o heading e escreva 1 linha explicativa:

```markdown
## Privacidade e dados sensíveis

Não se aplica a este guia. O SDK não coleta payload de request/response por padrão.
```

Justificativa: preservar esqueleto canônico ajuda leitores e agentes IA a identificar o tipo de doc imediatamente. Remover heading quebra ossatura.

---

## Headings PROIBIDOS

Lint rejeita qualquer um destes:

| Proibido | Motivo | Use no lugar |
|----------|--------|--------------|
| `## Quick start` (minúsculo) | E2 | `## Quick Start` |
| `## Quick Start - <variante>` (hífen simples como separator) | E2 | `## Quick Start — <variante>` (em-dash) |
| `## Sumário` em template `frontend-sdk-guide` | E1 exceção | `## Índice` |
| `## Índice` em qualquer outro template | E1 | `## Sumário` |
| `## TOC` ou `## Table of Contents` | inglês | `## Sumário` |
| `## Como rodar` ou `## Getting Started` | drift | `## Quick Start` |
| `## Verificação` | drift | `## Validação ponta a ponta` |
| `## Solução de problemas` | drift | `## Troubleshooting` |
| `## Perguntas frequentes` | drift | `## FAQ` |

---

## H3 dentro de Troubleshooting

Padrão sintoma → causa → fix. H3 é o sintoma:

```markdown
## Troubleshooting

### Métricas não aparecem no Mimir

**Sintoma.** Painel "OTel Service Health" no Grafana mostra "no data".

**Causa provável.** `OTEL_EXPORTER_OTLP_ENDPOINT` aponta pra DNS errado ou collector não está rodando.

**Fix.**

1. ...
2. ...
```

H3 começa com verbo ou descrição curta do sintoma. Não usar "Erro X" ou códigos opacos como heading.

---

## H3 dentro de FAQ

Padrão pergunta direta:

```markdown
## FAQ

### Posso usar Elven Observability sem o Operator?

Sim. ...

### Quanto tempo o Loki retém os logs?

30 dias por padrão; ...
```

Pergunta começa com maiúscula, termina com `?`. Resposta abaixo, prosa direta.
