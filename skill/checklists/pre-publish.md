# Pre-Publish Checklist

Checklist humano antes de abrir PR em `elven-observability/docs`. O `lint.sh` cobre o que é automatizável; este checklist cobre o que **só revisor humano** consegue avaliar.

> Use este arquivo como template de descrição de PR. Cada item marcado com `[x]` no PR.

---

## Sumário

- [Estrutura](#estrutura)
- [Frontmatter](#frontmatter)
- [Tom e voz](#tom-e-voz)
- [Conteúdo técnico](#conteúdo-técnico)
- [Lint binário](#lint-binário)
- [Acessibilidade](#acessibilidade)
- [Cliente-real check](#cliente-real-check)

---

## Estrutura

- [ ] Tipo do doc identificado e correto (um dos 5 templates).
- [ ] Slug em kebab-case sem acento; igual ao filename.
- [ ] H1 espelha `title` do frontmatter exatamente, sem versão de produto.
- [ ] Sumário/Índice presente (exceto pdtec-spec curto) e links âncora batem com headings.
- [ ] Ordem canônica de seções respeitada (ver `reference/canonical-section-headings.md`).
- [ ] Seções não-aplicáveis preservadas com "Não se aplica a este guia." (não removidas).

## Frontmatter

- [ ] 6 campos obrigatórios presentes (`title`, `slug`, `type`, `audience`, `last_reviewed`, `status`, `owner`).
- [ ] `type` é um dos 5 enums válidos.
- [ ] `audience` declara ≥1 persona; subset coerente com o tipo (ver `reference/frontmatter-spec.md`).
- [ ] `last_reviewed` atualizado para a data do PR.
- [ ] `status` correto (`draft` se ainda em revisão; `stable` se pronto para cliente).
- [ ] Se `status: deprecated`, campo `replaced_by` aponta para slug substituto.

## Tom e voz

- [ ] Imperativo direto: "Adicione", "Configure", "Rode" — nunca "vamos adicionar", "fazemos isso assim".
- [ ] Sem 1ª pessoa ("nós", "nosso").
- [ ] Sem hype: nada de "incrível", "revolucionário", "fácil".
- [ ] Não menciona Elven em terceira pessoa narrativa ("a Elven faz X") — em vez disso, descreve o sistema diretamente.
- [ ] pt-BR consistente, sem mistura com pt-PT.
- [ ] Termos técnicos OTel/LGTM grafados conforme `reference/glossary.md`.

## Conteúdo técnico

- [ ] Quick Start completo: cliente segue do passo 1 ao final em <10 minutos e vê primeiro sinal.
- [ ] Comandos rodam em macOS e Linux (testado).
- [ ] Code fences sempre com tag de linguagem correta.
- [ ] Variáveis de ambiente listadas em tabela com default e descrição.
- [ ] Validação ponta a ponta tem queries reais no Grafana (Tempo, Loki, Mimir conforme aplicável).
- [ ] Troubleshooting cobre os 3 sintomas mais comuns (sintoma → causa → fix).
- [ ] FAQ tem ≥3 perguntas reais (não inventadas).
- [ ] Links para outros docs do repo são relativos: `[texto](./outro-doc.md)`.
- [ ] Links externos preservam URL completa (não bit.ly, não goo.gl).

## Lint binário

- [ ] `elven-docs-skill lint <arquivo>` retorna `exit 0`.
- [ ] Output do lint colado na descrição do PR (mostra que passou).

## Acessibilidade

- [ ] Imagens com alt text descritivo (não "imagem" ou "diagrama").
- [ ] Diagramas Mermaid têm legenda em prosa antes/depois — leitor com screen reader entende sem renderizar.
- [ ] Sem emoji no corpo (`lint.sh` item 9 valida).
- [ ] Tabelas têm header row e células fazem sentido linha a linha.
- [ ] Links com texto descritivo ("ver guia de instrumentação Java") — nunca "clique aqui".
- [ ] Headings hierárquicos sem pular nível (não `H2 → H4`).

## Cliente-real check

Pergunte-se:

- [ ] Um SRE no cliente, sozinho, às 14h numa quarta-feira, segue este doc até o final sem precisar de Slack ou call?
- [ ] As mensagens de erro/troubleshooting são as que ele realmente vai ver, ou são "exemplos genéricos"?
- [ ] O doc menciona pré-requisitos de outras equipes do cliente (ex: time de DNS, time de IAM)?
- [ ] Se a Elven sair do ar 1 dia, o cliente sabe o que esperar/fazer baseado no que está aqui?

---

## Ações antes de mergear

1. Rodar `npm test` no repo `elven-docs-skill` (se mexeu em template).
2. Atualizar `last_reviewed`.
3. Rodar `elven-docs-skill lint` no doc.
4. Solicitar review de no mínimo 1 par técnico Elven + 1 da audiência alvo (cliente-eng se possível, ou alguém que represente).
5. Após aprovar: squash-merge com mensagem semântica (`docs(instrumentacao-java): atualiza tabela de pacotes para OTel 2.x`).
