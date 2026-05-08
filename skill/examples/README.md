# `examples/`

Diretório reservado para **exemplos vivos** — 1 doc preenchido por template, mostrando como o esqueleto vira doc real.

> **Aviso:** Este diretório **NÃO** é repositório de docs paralelo. Os docs reais da Elven moram em `elven-observability/docs/`. O conteúdo aqui é referência de aprendizado.

---

## Status atual

`v0.1.0` — diretório vazio. Exemplos serão adicionados na **v0.2.0**, após validação real do skill em PRs.

Razões pra deixar vazio em v0.1.0:

1. **Exemplos competem com templates.** Autor com pressa copia o exemplo em vez do template, propagando customização específica.
2. **Manutenção dobra.** Exemplo precisa ser atualizado toda vez que template muda.
3. **Versão real é melhor.** Os 12 docs reais em `elven-observability/docs/` (após Fase 7 / migração retroativa) viram o "exemplo vivo" autoritativo.

---

## Quando adicionar exemplos aqui

Adicione 1 exemplo por template **somente quando**:

- O template mudou de forma quebrante e precisa demonstração.
- Existe pergunta recorrente do tipo "como preencho a seção X?" — exemplo cura a dúvida.
- Onboarding eng-elven está com fricção em entender um template.

---

## Convenção quando adicionar

- Nome do arquivo: `example-<template-name>.md`.
  - ex: `example-language-instrumentation-guide.md`
- Frontmatter `status: draft` para sinalizar que é exemplo, não doc real.
- Comentário no topo do arquivo (após frontmatter, antes do H1):

```markdown
<!--
  Exemplo de language-instrumentation-guide preenchido.
  Use como referência. NÃO copie para docs/ — copie o template em ../templates/.
  Última atualização: 2026-MM-DD.
-->
```

---

## Substituto até v0.2.0

Use os 12 docs reais em `elven-observability/docs/` como exemplos vivos:

- `instrumentacao-java.md` — exemplo de `language-instrumentation-guide` (mais completo).
- `instrumentacao-kubernetes-operator.md` — exemplo de `platform-instrumentation-guide`.
- `instalacao-stack-observabilidade-kubernetes.md` — exemplo de `stack-installation-guide`.
- `faro-sdk-instrumentacao-frontend.md` — exemplo de `frontend-sdk-guide`.
- `pd-tec-instrumentacao.md`, `pd-tec-variaveis-ecs.md` — exemplos de `pdtec-spec`.

(Pós Fase 7, todos vão estar com frontmatter; antes disso, o conteúdo já serve como referência de prosa e estrutura.)
