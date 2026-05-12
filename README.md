# `@elven-observability/docs-skill`

Anthropic skill-creator pack que codifica o **padrão de documentação técnica e PS reports da Elven Works**. Distribuído via npm com instalação one-shot. Renderiza markdown → PDF temado Elven via Puppeteer.

> **Status:** v0.2.0. Cobre 9 templates canônicos: 5 docs técnicos (instrumentação, instalação, SDK frontend, PDtec) + 4 PS reports (incidente, teste de carga, comparativo, spike). Geração de PDF integrada.

---

## Sumário

- [O que esse skill faz](#o-que-esse-skill-faz)
- [Quando usar](#quando-usar)
- [Quando NÃO usar](#quando-não-usar)
- [Instalação](#instalação)
- [Uso](#uso)
- [Estrutura](#estrutura)
- [Templates disponíveis](#templates-disponíveis)
- [Decisões de padronização](#decisões-de-padronização)
- [Lint binário](#lint-binário)
- [Contribuindo](#contribuindo)
- [License](#license)

---

## O que esse skill faz

1. **Identifica** o tipo do doc que você quer escrever (5 templates canônicos).
2. **Gera** esqueleto preenchido com frontmatter YAML válido, ossatura de seções correta e callouts no padrão.
3. **Lintha** binariamente (10 regras automáticas) — falha o PR se drift.
4. **Recusa-se a inventar** templates pra tipos que não existem no repo (ADR, runbook, post-mortem).

## Quando usar

- Vai criar um guia novo de instrumentação (linguagem, plataforma, SDK frontend, PDtec).
- Vai revisar/normalizar um doc existente em `elven-observability/docs`.
- Antes de abrir PR em `elven-observability/docs` (gate de lint).
- Você é um agente IA (Claude Code, Sentinel) e precisa redigir doc no padrão da casa.

## Quando NÃO usar

- Doc fora do repositório `elven-observability/docs`.
- ADRs, runbooks, post-mortems, RFCs, release notes — out of scope v1.
- Documentação de API gerada (OpenAPI, TypeDoc, Sphinx autodoc).
- README de subprojetos da Elven que não são docs de produto.
- Tradução pt→en (repo é pt-BR-only nesta versão).

---

## Instalação

### Via npm global (recomendado)

```bash
npm install -g @elven-observability/docs-skill
elven-docs-skill install
```

A instalação **não é automática** (sem `postinstall` mágico): você roda `elven-docs-skill install` explicitamente. Filosofia: instalação é ato consciente, audível, reversível.

O comando copia `skill/*` pra `~/.claude/skills/elven-docs-skill/`. Em sessões Claude Code subsequentes, o skill aparece em `/skills` e pode ser invocado por nome ou por trigger semântico.

### Via npx (sem instalação global)

```bash
npx @elven-observability/docs-skill install
```

### Verificar instalação

```bash
elven-docs-skill --version
ls ~/.claude/skills/elven-docs-skill/SKILL.md
```

---

## Uso

### Pelo agente IA (Claude Code)

Em sessão nova, basta pedir:

```
use o skill elven-docs-skill pra criar um guia de instrumentação Go
```

O agente carrega o skill, identifica o tipo (`language-instrumentation-guide`), copia o template, preenche frontmatter, e produz `instrumentacao-go.md` no padrão.

### Manualmente

1. `cp ~/.claude/skills/elven-docs-skill/templates/<tipo>.md docs/<slug>.md`
2. Preencher frontmatter, H1, abertura, Sumário.
3. Preencher seções obrigatórias na ordem canônica.
4. Rodar lint: `elven-docs-skill lint docs/<slug>.md`
5. Resolver TODOS os warnings.
6. Self-review com `~/.claude/skills/elven-docs-skill/checklists/pre-publish.md`.
7. Atualizar `last_reviewed`; abrir PR.

### Lint contra um doc existente

```bash
elven-docs-skill lint docs/instrumentacao-java.md
```

Saída: `0` (passa) ou `1` (falha) com mensagem por item violado.

### Gerar PDF de um doc

```bash
# Theme automático: 'client' se type=ps-*, senão 'internal'
elven-docs-skill pdf docs/ps/20260302-relatorio-incidente-beyond.md
# → 20260302-relatorio-incidente-beyond.pdf (no mesmo dir)

# Forçar tema
elven-docs-skill pdf docs/instrumentacao-java.md --theme internal --out /tmp/java.pdf

# Theme 'client' inclui:
# - capa com título, cliente, data, severidade, owner
# - header com título do doc
# - footer com cliente + numeração de páginas
# - margens A4 generosas
# - cores Elven (texto #0d1530 sobre branco; accent #c95b29)
```

---

## Estrutura

```
@elven-observability/docs-skill/
├── bin/elven-docs-skill.js        # CLI (install, update, lint, --version, --help)
├── skill/                         # conteúdo distribuído
│   ├── SKILL.md                   # entry point Anthropic
│   ├── templates/                 # 5 esqueletos canônicos
│   ├── reference/                 # style guide, frontmatter spec, callout vocab, etc
│   ├── checklists/                # pre-publish, persona-coverage, accessibility
│   ├── scripts/                   # lint.sh + backfill-frontmatter.sh
│   └── examples/                  # exemplos vivos por template
└── tests/                         # fixtures pass/fail + lint.test.sh
```

---

## Templates disponíveis

### Docs técnicos (vão em `elven-observability/docs/`)

| Template | Quando usar | Persona alvo |
|----------|-------------|--------------|
| `language-instrumentation-guide` | Instrumentação para UMA linguagem (Java, Python, .NET, Node, Go, etc.) | cliente-eng, agente-ia |
| `platform-instrumentation-guide` | Instrumentação via plataforma/orquestrador (K8s Operator, Lambda, Serverless, ECS) | cliente-eng, agente-ia, onboarding-eng-elven |
| `stack-installation-guide` | Cliente hospeda/opera componente Elven na própria infra | cliente-sre, agente-ia, onboarding-eng-elven |
| `frontend-sdk-guide` | SDK web/cliente em matriz framework × caso (Faro, futuro RN) | cliente-eng (frontend), agente-ia |
| `pdtec-spec` | Spec curta (<300 linhas) específica do cliente PDtec | cliente-eng (PDtec), agente-ia |

### PS reports (vão em `elven-observability/docs/ps/`, geram PDF temado client)

| Template | Quando usar | Persona alvo |
|----------|-------------|--------------|
| `ps-incident-report` | Relatório formal de incidente entregue ao cliente (linha do tempo, MTTD/MTTR, causa raiz, plano de ação) | cliente-stakeholder, cliente-eng, cliente-sre |
| `ps-load-test-report` | Relatório de teste de carga (metodologia, p95/p99, throughput, bottlenecks, recomendações) | cliente-stakeholder, cliente-eng, cliente-sre |
| `ps-comparative-report` | Comparativo entre dois cenários (critério de decisão, métricas lado a lado, recomendação) | cliente-stakeholder, cliente-eng, cliente-sre |
| `ps-spike-report` | Análise de spike anômalo curto (hipóteses, evidência, conclusão) | cliente-stakeholder, cliente-eng, cliente-sre |

---

## Decisões de padronização

Resolvidas pelo skill com fonte 2026 (ver `skill/reference/style-guide.md`):

| # | Decisão | Por quê |
|---|---------|---------|
| E1 | TOC = `Sumário` (não `Índice`) | 8/12 docs do repo |
| E2 | `Quick Start —` (S maiúsculo, em-dash separator) | Maioria do repo + pt-BR sem norma sentence-case |
| E3 | Validação dedicada nos templates 1/2/3 | Onde Quick Start tem fluxo end-to-end |
| E4 | Versão do produto NUNCA no H1; vai pro frontmatter `product_version` | Drift detectado em 3 padrões diferentes |
| E5 | Callouts SEMPRE blockquote `>` com prefixo bold tipado | 58 ocorrências vs 7 inline |
| E6 | Emojis BANIDOS no corpo do doc | WCAG 2.2 SC 1.1.1 + 10/12 docs zero emoji |
| E7 | Diagramas Mermaid (GitHub native desde fev/2022); ASCII fallback | E aliases `text`/`mermaid` no fence |
| E8 | Heading depth max H4; tabela sempre com header row | Padrão consistente do repo |

---

## Lint binário

10 itens automatizados em `skill/scripts/lint.sh`:

1. Frontmatter presente.
2. 6 campos obrigatórios.
3. `type` é enum válido.
4. `slug` == filename.
5. Exatamente 1 H1.
6. TOC canônico ("Sumário" / "Índice" / dispensa por type).
7. `Quick Start` capitalizado, em-dash como separator.
8. Toda fence com tag de linguagem.
9. Sem emoji.
10. Callouts só em blockquote.

PR só mergeia se 10/10 passarem.

---

## Contribuindo

PRs são bem-vindos para:

- Adicionar fixtures de teste novas (`tests/fixtures/`).
- Refinar mensagens de erro do `lint.sh`.
- Atualizar `reference/style-guide.md` com fontes mais recentes.
- Reportar drift detectado em PRs reais que o lint não pegou.
- Melhorar `themes/client.css` e `themes/internal.css` (cores, tipografia, layout PDF).

PRs **NÃO** são bem-vindos para:

- Adicionar templates de tipos sem ≥3 instâncias reais no repo `elven-observability/docs` ou `docs/ps/`. Abra issue antes.
- Suavizar regras E1-E8 sem evidência nova ou demanda de cliente.
- Adicionar dependências runtime pesadas além de `puppeteer` e `marked`.

Workflow:

1. Fork → branch.
2. `npm test` deve passar.
3. Atualizar `CHANGELOG.md` na seção `[Unreleased]`.
4. Bump de versão segue semver:
   - patch (0.1.x): bugfix no lint, fixture nova
   - minor (0.x.0): template novo, decisão de padronização nova
   - major (x.0.0): mudança quebrante em frontmatter ou enum de `type`

---

## License

[MIT](LICENSE) © 2026 Elven Works.
