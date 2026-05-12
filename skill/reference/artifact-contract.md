# Artifact Contract

O que cada artefato gerado pelo skill **promete entregar**. Inspirado em `artifact-contract.md` do `claude-presentation-skill`.

Use este doc para responder a pergunta: "esse `.md` está pronto?" — comparando o que ele tem com o que o contrato exige.

---

## Sumário

- [Princípio: skill produz package, não arquivo isolado](#princípio-skill-produz-package-não-arquivo-isolado)
- [Contratos por template](#contratos-por-template)
- [Regra de coerência cruzada](#regra-de-coerência-cruzada)

---

## Princípio: skill produz package, não arquivo isolado

Mesmo quando o usuário pede "1 doc", a entrega quase sempre inclui:

- o `.md` fonte (canonical),
- o `.pdf` renderizado (quando é PS report ou doc-pra-cliente),
- frontmatter coerente que serve para indexação RAG,
- referências cruzadas para outros docs já existentes.

Se você produziu o `.md` e ele "passa no lint" mas não tem referências cruzadas óbvias, o package está incompleto.

---

## Contratos por template

### `language-instrumentation-guide`

**Objetivo.** Cliente eng com aplicação em linguagem X consegue:

- saber se essa linguagem é suportada pela Elven Observability,
- escolher entre zero-code e programático,
- rodar o Quick Start de uma variante em <10 min,
- validar que dados estão chegando no Grafana,
- saber troubleshooting dos 3 sintomas mais comuns.

**Deve conter.**

- Frontmatter completo + `product_version`.
- Tabela de pacotes/dependências com versão mínima.
- ≥1 Quick Start com 4 subpassos (dependência, ENV, run, validação).
- Tabela de variáveis de ambiente obrigatórias e opcionais.
- Seção de validação ponta a ponta com queries reais Tempo/Loki/Mimir.
- Seção de troubleshooting com 3+ sintomas em formato (sintoma → causa → fix).

**Não pode conter.**

- Receita pra desligar logs/métricas/traces (Elven mode os mantém ligados).
- Recomendação pra rodar agent legado (NewRelic, Datadog) em paralelo.

---

### `platform-instrumentation-guide`

**Objetivo.** Cliente eng/SRE com workload em plataforma X (K8s, Lambda, ECS, Serverless) consegue:

- entender o mecanismo de injeção da Elven nessa plataforma,
- escolher entre opt-in por unidade (deployment/função) ou por escopo (namespace/stack),
- aplicar Quick Start,
- validar primeiros sinais,
- entender troubleshooting.

**Deve conter.**

- Diagrama Mermaid de arquitetura.
- Tabela de "tipos de workload suportados" com ✓/⚠/—.
- Seção "Quando usar este guia" delimitando fronteira com outros guides.
- Quick Start + Instalação passo a passo (a versão expandida).
- Seção "Controle por <unidade>" com exemplo de annotation/tag.
- Validação + Troubleshooting + FAQ.

---

### `stack-installation-guide`

**Objetivo.** Cliente SRE consegue hospedar componente Elven na infra dele:

- entendendo escopo (cliente vs Elven),
- pré-instalando dependências (Helm, kubectl, DNS),
- rodando Quick Start,
- validando, atualizando, removendo,
- mantendo no longo prazo.

**Deve conter.**

- Callout `> **Importante:**` explicitando que componente roda na infra do cliente.
- Pré-requisitos completos: plataforma, ferramentas, acesso Elven, DNS/TLS.
- Quick Start (≤30 min) + Instalação passo a passo.
- Seções de Atualização e Remoção.
- Checklist final em formato `- [ ]`.
- Cross-ref para `instrumentacao-<linguagem>.md`.

---

### `frontend-sdk-guide`

**Objetivo.** Cliente eng frontend consegue instrumentar app web em qualquer dos N frameworks suportados.

**Deve conter.**

- H2 `## Índice` (não Sumário — convenção da família).
- Seção "O que o SDK captura" (Web Vitals, errors, sessions, etc.).
- Bloco de configuração base.
- H2 por framework: React, Next.js, Angular, Vue.js, Vanilla JS.
- Seção dedicada a OpenTelemetry Tracing.
- Seção de Privacidade e dados sensíveis (PII, masking).

---

### `pdtec-spec`

**Objetivo.** Cliente PDtec consegue aplicar mudança específica (variáveis ECS, Dockerfile patch) em <5 minutos.

**Deve conter.**

- Doc curto (<300 linhas).
- Foco em copy-paste.
- Tabelas de variáveis ou bloco JSON.
- Troubleshooting opcional.

**Não precisa.**

- Sumário (dispensa quando <8 H2).
- FAQ (raramente compensa).

---

### `ps-incident-report`

**Objetivo.** Cliente stakeholder/SRE recebe relatório formal de incidente que:

- explica o que aconteceu em linguagem clara no Sumário Executivo,
- detalha linha do tempo precisa (BRT),
- quantifica impacto (negócio, sistemas, usuários),
- explica causa raiz e análise dos 5 porquês,
- entrega plano de ação com responsável e prazo.

**Deve conter.**

- Frontmatter com `incident_id`, `incident_date`, `client`, `severity`.
- Sumário Executivo de 3-5 parágrafos (sem jargão).
- Tabela de linha do tempo com colunas Hora/Evento/Responsável/Fonte.
- Métricas quantificadas no Impacto (R$, % usuários, requests).
- MTTD e MTTR explícitos.
- Plano de ação como tabela com status.
- Glossário.

**Deve gerar PDF temado `client`** com capa e header/footer.

---

### `ps-load-test-report`

**Objetivo.** Cliente stakeholder/SRE entende se o sistema suporta a carga alvo, onde está o bottleneck, e o que fazer.

**Deve conter.**

- Frontmatter com `test_date`, `client`, `scenario`, `target_environment`.
- Sumário Executivo com resultado headline quantificado.
- Objetivo do teste com critério de aceitação claro.
- Metodologia: ferramenta, modelo de carga (ramp/sustained/stress), payload.
- Tabela de resultados com p50/p95/p99, throughput, error rate.
- Análise de bottlenecks com evidência (query Mimir, Pyroscope snapshot).
- Recomendações ordenadas por impacto/esforço.
- Anexos: links pra dashboards Grafana, scripts.

---

### `ps-comparative-report`

**Objetivo.** Cliente stakeholder decide entre A e B com base em métricas paralelas e recomendação clara.

**Deve conter.**

- Frontmatter com `baseline_label` e `comparison_label`.
- Pergunta de negócio explícita.
- Critério de decisão definido **antes** dos resultados.
- Cenários A e B descritos em paralelo (mesma estrutura de tabela).
- Métricas lado a lado com delta em %.
- Trade-offs identificados (não escondidos).
- Recomendação clara + plano de migração se aplicável.

---

### `ps-spike-report`

**Objetivo.** Cliente SRE entende o que causou um spike anômalo e como prevenir.

**Deve conter.**

- Frontmatter com `spike_date`, `spike_window_brt`, `severity_estimated`.
- Janela observada (data, hora início/fim em BRT, duração).
- Tabela de métricas: baseline vs pico, com delta.
- Métricas que NÃO se moveram (assinatura diagnóstica).
- Linha do tempo curta.
- Lista de hipóteses com status (confirmada/descartada/inconclusiva).
- Análise das hipóteses com evidência.
- Conclusão com causa raiz inferida.
- Recomendações com prazo.

---

## Regra de coerência cruzada

Quando um destes muda no doc, **conferir os outros**:

- nome do cliente
- nome dos serviços/apps
- métricas (números devem bater entre seções)
- janelas de horário
- responsáveis de ações
- prazos
- endpoint/URL

Se o Sumário Executivo diz "MTTR = 41 min" e a seção de Mitigação diz "MTTR = 42 min", o doc não está pronto. Numbers must match across sections.

---

## Padrão "Não se aplica"

Se uma seção obrigatória pelo contrato **não se aplica** ao seu doc específico, **NÃO REMOVA** o heading. Escreva:

```markdown
## <Heading obrigatório>

Não se aplica a este guia. (1 linha de justificativa)
```

Isso preserva ossatura para leitores humanos e agentes IA.
