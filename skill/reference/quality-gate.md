# Quality Gate

Não marque um doc como `status: stable` (ou um PR como pronto para merge) até que TODOS os gates abaixo passem. Inspirado no padrão `quality-gate.md` do `claude-presentation-skill`.

> Filosofia: este checklist **não é decorativo**. Cada gate corresponde a uma falha real que aconteceu em entregas Elven anteriores. Se algum gate ainda é fraco, **diga honestamente** em vez de declarar `10/10` falso.

---

## Sumário

- [Gate 1 — Verdade técnica](#gate-1--verdade-técnica)
- [Gate 2 — Coerência narrativa](#gate-2--coerência-narrativa)
- [Gate 3 — Coerência de artefatos](#gate-3--coerência-de-artefatos)
- [Gate 4 — Lint binário](#gate-4--lint-binário)
- [Gate 5 — Acessibilidade WCAG 2.2](#gate-5--acessibilidade-wcag-22)
- [Gate 6 — Pergunta final de aceite](#gate-6--pergunta-final-de-aceite)

---

## Gate 1 — Verdade técnica

- Nomes de apps, serviços, endpoints batem com a infra real do cliente (não placeholder).
- Comandos no Quick Start rodam em uma máquina limpa do cliente (testado, não imaginado).
- Versões de runtime, OTel SDK, helm charts, AWS layers são as **vigentes** na data do `last_reviewed`.
- Métricas (p95, RPS, error rate) são reais do ambiente alvo, não chutadas.
- Nada de afirmações "current year" baseadas em training data; valide via WebSearch quando a afirmação é técnica e datada.

> **Gate falha se.** O doc cita "Faro v1" quando a versão atual é v2; ou "Stack v1.4.0" quando o cliente já migrou pra v2.0.

---

## Gate 2 — Coerência narrativa

- Cada seção justifica sua presença. Seção que diz "não se aplica a este guia" é OK desde que outras seções dependam dela conceitualmente.
- Quick Start, Configuração e Validação ponta a ponta contam **a mesma história** com variáveis idênticas.
- Tabelas de variáveis de ambiente referenciam os mesmos nomes que aparecem nos exemplos de código.
- Troubleshooting cobre os 3 sintomas mais prováveis, não cenários teóricos.
- FAQ tem perguntas que clientes reais fizeram — não invenção.

> **Gate falha se.** Doc usa `OTEL_EXPORTER_OTLP_ENDPOINT` na seção 5 e `OTLP_ENDPOINT` na seção 8 para a mesma variável.

---

## Gate 3 — Coerência de artefatos

Para PS reports e docs que viram PDF/HTML, verificar consistência entre artefatos:

- O `.md` fonte e o `.pdf` renderizado contam a mesma história. Se o PDF parece diferente do markdown lido, algo quebrou no render.
- Tabelas no `.md` renderizam corretamente no PDF (não cortam linhas, não estouram a página).
- Code blocks não cortam em meio de linha.
- Diagramas Mermaid renderizam (ou são substituídos por imagem antes de gerar PDF).
- Header e footer do PDF têm o `client` do frontmatter (capa não está com placeholder `<Cliente>`).

**Verificação prática.**

```bash
elven-docs-skill pdf relatorio.md
open relatorio.pdf
# Abrir e olhar visualmente. Não só "abriu sem erro".
```

> **Gate falha se.** Capa do PDF diz "Cliente: <Cliente>" porque você esqueceu de preencher `client:` no frontmatter.

---

## Gate 4 — Lint binário

```bash
elven-docs-skill lint <arquivo.md>
# esperado: exit 0
```

Os 10 itens do `lint.sh`:

1. Frontmatter presente.
2. 6 campos obrigatórios.
3. `type` é enum válido (1 dos 9).
4. `slug` == filename.
5. Exatamente 1 H1 (fora de code blocks).
6. TOC canônico por type.
7. `Quick Start` capitalizado, em-dash em variantes.
8. Toda fence com tag de linguagem.
9. Sem emoji.
10. Callouts apenas em blockquote tipado.

> **Gate falha se.** O lint retorna exit 1.

---

## Gate 5 — Acessibilidade WCAG 2.2

Ver [`accessibility.md`](../checklists/accessibility.md) para o checklist completo. Items críticos:

- Imagens com `alt` descritivo (não "image", "diagram").
- Sem emoji no corpo (validado pelo lint).
- Links com texto descritivo, nunca "clique aqui".
- Hierarquia de heading sem pular nível.
- Mermaid acompanhado de prosa explicativa para leitores com screen reader.
- Contraste em PDF: tema CSS usa cores Elven com contraste >= 4.5:1 para texto principal (validar em monitor real, não printscreen).

> **Gate falha se.** O PDF rodado tem texto cinza claro sobre fundo cinza claro porque o tema CSS quebrou em algum ambiente.

---

## Gate 6 — Pergunta final de aceite

Antes de marcar o doc como pronto para entrega ao cliente (ou merge no main), responda internamente:

> **"Se o cliente abrir este doc/PDF amanhã de manhã, sem nenhum contexto adicional do meu lado, o que ainda pode envergonhar a Elven?"**

Razões típicas para NÃO declarar 10/10:

- Placeholder ainda visível (`<Cliente>`, `<YYYY-MM-DD>`).
- Number redondo demais (ex: "300 ms" exato quando o real era "287 ms").
- "Próximos passos" sem responsável nomeado nem prazo.
- Sumário executivo com jargão (CTO/COO precisa de NLP, não decorar o que é "p95").
- Visual review do PDF não feito (lido só o markdown).
- Comando shell que assumimos que roda mas ninguém testou em macOS+Linux.

Se a resposta à pergunta acima é não-trivial, **continue trabalhando**. Não declare aceito.

---

## Status honesto

Quando algo passa "no limite", **diga isso**. Não infle. Padrões de honestidade:

- "Gates 1-5 passam. Gate 6 ainda tem 1 placeholder que vou corrigir antes de mergear."
- "Gates 1-4 passam. Gate 5 (acessibilidade) tem 1 item pendente: alt text em 3 imagens — registrado como follow-up."
- "Gate 1 falha porque não conferi a versão do Faro SDK vigente. Vou conferir e re-rodar."

Inflar score serve a quem? Não a você, não ao cliente, não ao time.
