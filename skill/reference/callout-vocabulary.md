# Callout Vocabulary

Vocabulário fechado de callouts em docs Elven. Sempre como blockquote `>` com prefixo bold tipado.

---

## Os 6 prefixos permitidos

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `> **Atenção:**` | Risco operacional, configuração que pode quebrar produção | `> **Atenção:** O LOKI_URL deve conter apenas a URL base.` |
| `> **Importante:**` | Pré-condição crítica que precisa estar satisfeita | `> **Importante:** O DNS do domínio deve apontar para o IP público antes da instalação.` |
| `> **Nota:**` | Informação contextual relevante mas não crítica | `> **Nota:** A instrumentação automática funciona melhor com aplicações em release mode.` |
| `> **Dica:**` | Atalho, otimização, boa prática | `> **Dica:** Habilite JWT_VALIDATE_EXP=true em produção e rotacione tokens periodicamente.` |
| `> **Cuidado:**` | Risco de segurança ou de exposição de dados | `> **Cuidado:** O token fica visível no browser. Use role: user (menor privilégio).` |
| `> **Aviso:**` | Limitação ou comportamento não-óbvio | `> **Aviso:** Em modo Elven, logs/métricas/traces ficam sempre ligados. Tentar desligar um deles é tratado como erro de configuração.` |

Lint rejeita qualquer outro prefixo bold em blockquote (ex: `> **Heads up:**`, `> **Warning:**`). Ordene a mensagem em volta dos 6 prefixos acima — quase sempre dá pra encaixar.

---

## Regras

### 1. Sempre dentro de blockquote

```markdown
> **Atenção:** Não rode em produção sem testar em staging.
```

NÃO use bold inline fora de blockquote para o mesmo prefixo:

```markdown
**Atenção:** Não rode em produção sem testar em staging.   <!-- REJEITADO -->
```

### 2. Bold apenas no prefixo

```markdown
> **Importante:** Configure appName antes de inicializar.
```

NÃO bold a mensagem inteira:

```markdown
> **Importante: Configure appName antes de inicializar.**   <!-- mau gosto, lint não pega mas review humano deve -->
```

### 3. Múltiplos parágrafos no callout

```markdown
> **Nota:** O sampling é por sessão.
>
> Quando uma sessão é amostrada, todos os eventos daquela sessão são capturados.
> Isso garante visão completa de cada sessão amostrada.
```

Use `>` em todas as linhas, inclusive a vazia (apenas `>`).

### 4. Code inline e listas dentro de callouts

Permitido:

```markdown
> **Dica:** Variáveis úteis:
>
> - `OTEL_EXPORTER_OTLP_ENDPOINT` — endpoint do collector
> - `OTEL_RESOURCE_ATTRIBUTES` — atributos do resource
```

### 5. Code fence dentro de callout

**EVITAR.** Code fence dentro de blockquote tem renderização inconsistente em GitHub e em alguns parsers RAG. Se precisa de bloco de código, tire o callout antes:

```markdown
> **Atenção:** Adicione esta env var antes do deploy.

```yaml
OTEL_RESOURCE_ATTRIBUTES: deployment.environment=production
```
```

---

## Anti-padrões observados (e que o skill normaliza)

### Anti-padrão A: emoji como prefixo

```markdown
> ⚠️ Atenção: token expira em 24h.   <!-- REJEITADO -->
```

→ usar:

```markdown
> **Atenção:** Token expira em 24h.
```

Justificativa: `style-guide.md` E6.

### Anti-padrão B: prefixos em inglês

```markdown
> **Warning:** This is risky.   <!-- REJEITADO -->
> **Note:** This is contextual. <!-- REJEITADO -->
```

→ usar:

```markdown
> **Atenção:** Isso é arriscado.
> **Nota:** Isso é contextual.
```

### Anti-padrão C: prefixo sem bold

```markdown
> Atenção: cuidado com o token.   <!-- REJEITADO -->
```

→ usar:

```markdown
> **Atenção:** Cuidado com o token.
```

### Anti-padrão D: prefixo + dois pontos sem bold

```markdown
> Importante. O DNS deve estar configurado.   <!-- ambíguo -->
```

→ usar formato canônico.

### Anti-padrão E: callout vazio (decoração)

```markdown
> Esta seção descreve a arquitetura.   <!-- não é callout, é prosa fora do lugar -->
```

Blockquote sem prefixo bold tipado é tratado como **citação literal de fonte externa** ou **resumo destacado** — usos legítimos. Mas se você está apenas destacando prosa, melhor escrever direto sem `>`.

---

## Tabela de tradução EN → PT-BR

Pra quem traz hábito de docs em inglês:

| Inglês | PT-BR |
|--------|-------|
| Note | Nota |
| Important | Importante |
| Warning | Atenção |
| Caution | Cuidado |
| Tip / Pro tip | Dica |
| Heads up / FYI | Aviso |
| Danger | Cuidado |
| Info | Nota |

---

## Por que vocabulário fechado

1. **Predictability pra agente IA.** Sentinel/Claude consomem callouts como sinal estruturado. 6 prefixos conhecidos > 30 variações ad-hoc.
2. **Lint binário.** Vocabulário aberto não é lintável. Fechado é.
3. **Tradução fácil.** Se um dia a Elven precisar publicar em inglês, mapeamento é 1:1.
4. **Tom consistente.** Doc não vira mosaico de preferências de cada autor.
