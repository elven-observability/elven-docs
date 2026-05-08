# Accessibility Checklist (WCAG 2.2 mínimo)

Checklist mínimo de acessibilidade pra docs Elven. Baseado em [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (acessado maio/2026).

> Acessibilidade aqui é responsabilidade do **autor do doc**. Renderização final (cores, fontes, contraste) depende do tema do site/IDE/Grafana — fora do escopo deste skill.

---

## Sumário

- [Não-textual com alternativa textual (1.1.1)](#não-textual-com-alternativa-textual-111)
- [Estrutura semântica (1.3.1)](#estrutura-semântica-131)
- [Hierarquia de headings (2.4.6 + 2.4.10)](#hierarquia-de-headings-246--2410)
- [Links significativos (2.4.4)](#links-significativos-244)
- [Linguagem da página (3.1.1)](#linguagem-da-página-311)
- [Idioma de partes (3.1.2)](#idioma-de-partes-312)
- [Contraste mínimo (1.4.3)](#contraste-mínimo-143)

---

## Não-textual com alternativa textual (1.1.1)

[Understanding SC 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

- [ ] Toda imagem (`![alt](url)`) tem alt text descritivo. **Não use** "imagem", "diagrama", "screenshot" como alt — descreva o conteúdo.
- [ ] Diagramas Mermaid têm legenda em prosa antes ou depois explicando o fluxo. Leitor com screen reader não consegue ver o SVG.
- [ ] Emojis são **proibidos** no corpo (E6); use texto explícito (`**OK**`, `**Falha**`). Justificativa: H86 do W3C exige `aria-label` em emoji-as-information; markdown não suporta inline.
- [ ] ASCII art tem prosa equivalente — não confiar que leitor vai parsear `┌──┐`.

### Exemplo OK

```markdown
![Diagrama de arquitetura mostrando aplicação enviando OTLP para o Collector, que encaminha para Loki, Tempo e Mimir](./assets/arquitetura.png)

A aplicação envia traces, métricas e logs em OTLP/HTTP para o OpenTelemetry Collector. O Collector roteia: traces para Tempo, logs para Loki, métricas para Mimir.
```

### Exemplo NÃO OK

```markdown
![diagrama](./assets/arquitetura.png)
```

---

## Estrutura semântica (1.3.1)

[Understanding SC 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

- [ ] Listas usam `-` ou `1.` (markdown semântico), não `<br>` simulado.
- [ ] Tabelas têm header row (linha de `|---|`).
- [ ] Code fences com tag de linguagem para que screen readers possam anunciar contexto.
- [ ] Bold/italic usados pra ênfase semântica, não decoração.

---

## Hierarquia de headings (2.4.6 + 2.4.10)

[Understanding SC 2.4.6](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html), [SC 2.4.10](https://www.w3.org/WAI/WCAG22/Understanding/section-headings.html)

- [ ] Exatamente 1 H1 por arquivo (lint item 5 valida).
- [ ] Hierarquia sequencial: H2 → H3 → H4. **Não pular** H2 → H4.
- [ ] Heading máx H4 (E8; lint valida). H5+ indica que a seção deveria ser doc separado.
- [ ] Heading text descritivo: "Configuração por variáveis de ambiente", não "Config 1".

---

## Links significativos (2.4.4)

[Understanding SC 2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)

- [ ] Texto do link descreve o destino. **Nunca** "clique aqui", "saiba mais", "este link".

### Exemplo OK

```markdown
Veja o [guia de instrumentação Java](./instrumentacao-java.md).
Documentação oficial: [OpenTelemetry Java Agent](https://opentelemetry.io/docs/zero-code/java/).
```

### Exemplo NÃO OK

```markdown
Veja [aqui](./instrumentacao-java.md).
Para mais informações [clique aqui](https://opentelemetry.io/...).
```

---

## Linguagem da página (3.1.1)

[Understanding SC 3.1.1](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html)

- [ ] Doc é integralmente em pt-BR. Sem mistura com pt-PT, sem inglês na prosa principal.
- [ ] Termos técnicos em inglês (OpenTelemetry, OTLP, span, trace) são preservados — não traduzir.

---

## Idioma de partes (3.1.2)

[Understanding SC 3.1.2](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html)

- [ ] Quando há trecho em inglês (ex: comentário em código, output de comando), o contexto deixa claro pelo bloco code fence.
- [ ] Não embutir frases inteiras em inglês na prosa pt-BR.

---

## Contraste mínimo (1.4.3)

[Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

Renderização final do markdown depende do tema do site/IDE/Grafana — fora do controle do autor. Mas no markdown:

- [ ] Não use cor inline (`<span style="color:red">`); markdown não garante contraste.
- [ ] Status crítico em texto explícito (`**Falha**`), não dependendo de cor.

---

## Bonus: legibilidade

Não exigido por WCAG 2.2 mas recomendado:

- [ ] Parágrafos curtos (≤5 linhas).
- [ ] Listas para enumerações (≥3 itens) em vez de prosa.
- [ ] Frases ativas; voz passiva apenas quando o agente é desconhecido/irrelevante.
- [ ] Vocabulário do `glossary.md` em vez de sinônimos.

---

## O que esse checklist NÃO cobre

- WCAG nível AAA (overkill pra doc técnica interna).
- Compatibilidade com leitores de tela específicos (NVDA, JAWS, VoiceOver).
- Internacionalização (i18n) — repo é pt-BR-only nesta versão.
- Validação automatizada de alt text — `lint.sh` v0.1.0 não verifica; roadmap pós-v0.1.

---

## Fonte

[Web Content Accessibility Guidelines (WCAG) 2.2 — W3C Recommendation](https://www.w3.org/TR/WCAG22/) (acessado 2026-05-08).
