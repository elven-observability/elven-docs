# Persona Coverage Matrix

Matriz template × persona. Cada doc DECLARA `audience` no frontmatter; o lint avisa se a persona declarada não casa com as válidas para o `type`.

---

## Personas (6)

| ID | Quem é | Onde lê | O que precisa do doc |
|----|--------|---------|---------------------|
| **`cliente-eng`** | Engenheiro/SRE no cliente integrando Elven com aplicação dele | Em IDE durante a integração; em browser durante deploy | Quick Start <10min, copy-paste, validação verificável, troubleshooting com sintoma→fix |
| **`cliente-sre`** | SRE do cliente operando componente Elven hospedado | Em IDE/Helm chart durante setup; em runbook durante incidente | Pré-requisitos completos (DNS, IAM, recursos), Quick Start, validação, troubleshooting, atualização, remoção |
| **`cliente-stakeholder`** | Executivo/decisor não-técnico do cliente (CTO, Head of Eng, COO) | Em PDF impresso ou tablet, frequentemente fora de fluxo de trabalho técnico | Sumário executivo claro e quantificado; impacto em métricas de negócio; recomendação com prazo; sem jargão; visual profissional |
| **`agente-ia`** | Sentinel/Claude/outro agente AI consumindo doc como contexto | Indexação RAG, retrieval por query semântica | Frontmatter filtrável (`type`, `audience`, `status`), headings estáveis, fences tipados, sem ruído visual |
| **`eng-elven`** | Engenheiro Elven escrevendo/revisando doc | Em IDE escrevendo PR | Template canônico, lint binário, exemplos vivos |
| **`onboarding-eng-elven`** | Pessoa nova no time Elven nos primeiros 30 dias | Em browser/IDE estudando o stack | Mapa do território, "como funciona", convenções (PDtec, Collector FE), referência cruzada |

---

## Matriz template × persona

| Template | `cliente-eng` | `cliente-sre` | `cliente-stakeholder` | `agente-ia` | `eng-elven` | `onboarding-eng-elven` |
|----------|---------------|---------------|-----------------------|-------------|-------------|------------------------|
| `language-instrumentation-guide` | ✓ primário | — | — | ✓ secundário | ✓ autoria | — |
| `platform-instrumentation-guide` | ✓ primário | ✓ quando overlap eng/SRE | — | ✓ secundário | ✓ autoria | ✓ contexto de plataforma |
| `stack-installation-guide` | — | ✓ primário | — | ✓ secundário | ✓ autoria | ✓ contexto arquitetural |
| `frontend-sdk-guide` | ✓ primário (frontend) | — | — | ✓ secundário | ✓ autoria | — |
| `pdtec-spec` | ✓ primário (PDtec) | — | — | ✓ secundário | ✓ autoria | ✓ entender convenção PDtec |
| `ps-incident-report` | ✓ secundário (lê detalhe técnico) | ✓ secundário | ✓ primário (Sumário Executivo) | ✓ secundário | ✓ autoria | — |
| `ps-load-test-report` | ✓ secundário | ✓ secundário (recomendações) | ✓ primário | ✓ secundário | ✓ autoria | — |
| `ps-comparative-report` | ✓ secundário | ✓ secundário | ✓ primário (decisão) | ✓ secundário | ✓ autoria | — |
| `ps-spike-report` | ✓ primário (debug técnico) | ✓ primário | ✓ secundário (sumário) | ✓ secundário | ✓ autoria | — |

Legenda:

- **primário** — doc foi escrito principalmente para esta persona; deve apurar UX dela.
- **secundário** — persona consome mas não é alvo principal; estrutura serve sem ser otimizada.
- **autoria** — persona escreve este tipo (não consome como leitor).
- **contexto** — persona usa o doc para entender território, não pra executar a tarefa.

---

## Valores válidos de `audience` por `type`

Lint emite warning se `audience` ⊄ válidas pra o `type`.

| `type` | `audience` válidas (subset de) |
|--------|--------------------------------|
| `language-instrumentation-guide` | `cliente-eng`, `agente-ia`, `eng-elven` |
| `platform-instrumentation-guide` | `cliente-eng`, `cliente-sre`, `agente-ia`, `eng-elven`, `onboarding-eng-elven` |
| `stack-installation-guide` | `cliente-sre`, `agente-ia`, `eng-elven`, `onboarding-eng-elven` |
| `frontend-sdk-guide` | `cliente-eng`, `agente-ia`, `eng-elven` |
| `pdtec-spec` | `cliente-eng`, `agente-ia`, `eng-elven`, `onboarding-eng-elven` |

`eng-elven` não é declarado como `audience` em docs públicos (eng-elven é autor, não leitor); incluir só se o doc é interno tipo "como escrever guia de instrumentação".

---

## Onde cada persona falha hoje (e o que o skill garante)

### `cliente-eng`

**Falha hoje.**

- Headings inconsistentes (Sumário vs Índice) dificultam Ctrl+F.
- Sem frontmatter, não consegue filtrar lista de docs por linguagem dele.
- Validação solta em prosa em metade dos docs vs. seção dedicada na outra.

**Skill garante.**

- Sumário sempre H2 com nome canônico.
- Frontmatter `type` e `audience` filtráveis.
- Validação dedicada nos templates 1/2/3.

### `cliente-sre`

**Falha hoje.**

- Pré-requisitos espalhados em prosa solta.
- Atualização e remoção raras como seções dedicadas.

**Skill garante.**

- Template `stack-installation-guide` exige ambos.
- Checklist final consolidado.

### `agente-ia`

**Falha hoje.**

- Sem frontmatter, agente reabre doc inteiro pra confirmar tipo.
- Heading drift impede match exato em chunking.

**Skill garante.**

- Frontmatter obrigatório (8 campos).
- Vocabulário de heading fechado.
- Fences sempre tipados.

### `eng-elven`

**Falha hoje.**

- Cada autor copia doc mais próximo e adapta — drift inevitável.
- Sem reference/code-fence-language-map, escolha de fence é folclore.

**Skill garante.**

- 5 templates explícitos.
- Decisões E1-E8 cravadas com fonte.
- `lint.sh` falha PR.

### `onboarding-eng-elven`

**Falha hoje.**

- Sem índice central nem `audience` explícita pra leituras prioritárias.
- Convenção PDtec opaca.

**Skill garante.**

- Frontmatter `audience` filtrável.
- `reference/glossary.md` documenta PDtec, Collector FE, etc.

---

## Adicionar persona nova (processo)

1. Não adicione persona porque "parece útil". Adicione quando há padrão recorrente de leitor não coberto.
2. Abra issue com:
   - 3+ exemplos de leitura/uso real.
   - Template(s) onde se aplica.
   - O que falta no skill atual pra essa persona.
3. PR adiciona valor à matriz e aos defaults de `audience` por `type`.
4. Bump minor (`0.x.0`) — persona nova é mudança de contrato.
