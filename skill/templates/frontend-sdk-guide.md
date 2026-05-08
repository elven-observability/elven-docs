---
title: Instrumentação Frontend com <SDK>
slug: <sdk-slug>-instrumentacao-frontend
type: frontend-sdk-guide
audience: [cliente-eng, agente-ia]
product_version: "<SDK> v<MAJOR>"
last_reviewed: 2026-05-08
status: draft
owner: time-frontend@elven.works
---

# Instrumentação Frontend com <SDK>

Guia completo para instrumentar aplicações **frontend** com o <SDK>, capturando **Web Vitals**, erros JS, sessões, eventos customizados, e enviando os dados para a stack da Elven Observability.

> **Nota:** Este guia cobre N frameworks (React, Next.js, Angular, Vue, Vanilla). Use o índice para pular direto pro framework que se aplica.

---

## Índice

- [Visão geral](#visão-geral)
- [O que o SDK captura](#o-que-o-sdk-captura)
- [Instalação](#instalação)
- [Configuração base](#configuração-base)
- [React](#react)
- [Next.js](#nextjs)
- [Angular](#angular)
- [Vue.js](#vuejs)
- [Vanilla JavaScript / HTML](#vanilla-javascript--html)
- [OpenTelemetry Tracing](#opentelemetry-tracing)
- [Identificação do usuário logado](#identificação-do-usuário-logado)
- [Privacidade e dados sensíveis](#privacidade-e-dados-sensíveis)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Visão geral

3-5 parágrafos:

1. O que o SDK entrega no front (RUM: Web Vitals, errors, custom events, sessions).
2. Para onde os dados vão: **Collector FE** (na infra do cliente) → **Loki** (na Elven).
3. Versão atual do SDK e quebras conhecidas em majors.
4. Quando este SDK é o caminho — e quando outras opções são melhores (ex: Sentry, NewRelic Browser).

> **Importante:** O <SDK> requer um **Collector FE** rodando na infra do cliente (consulte `collector-fe-instrumentation.md`). O front envia ao Collector FE, que encaminha pra Elven.

---

## O que o SDK captura

### Por padrão

- **Web Vitals.** LCP, INP, CLS, FCP, TTFB. (Faro v2 removeu FID; INP é o substituto.)
- **Erros JavaScript.** Uncaught exceptions, unhandled promise rejections, console errors.
- **Sessões.** Identificador único por sessão de usuário; eventos vinculados.
- **User actions.** Cliques, submits, navegações (auto-detectados).
- **Page views.** Mudanças de rota em SPAs.

### Sob configuração

- **OpenTelemetry tracing** de fetch/XHR.
- **Console logs** (info/warn/error) — sob demanda.
- **Session replay** (custo extra; opt-in).

### O que NÃO captura

- Server-side renders (use o agent de linguagem no servidor).
- Métricas custom de negócio (use OTel manual ou outro caminho).
- Dados de payload sensível (você é responsável por sanitização).

---

## Instalação

### Via npm/yarn/pnpm

```bash
npm install @<sdk-package>
# ou
yarn add @<sdk-package>
# ou
pnpm add @<sdk-package>
```

### Via CDN (apenas para protótipos)

```html
<script src="https://unpkg.com/@<sdk-package>@<version>/dist/index.js"></script>
```

> **Aviso:** CDN é OK pra spike, mas em produção use bundle pra controlar versão e cache.

---

## Configuração base

Configuração mínima funcional. Cada framework abaixo tem variante específica, mas todas começam aqui.

```typescript
import { initialize<SDK> } from "@<sdk-package>";

initialize<SDK>({
  url: "https://collector-fe.<dominio-cliente>/collect",
  app: {
    name: "<seu-app>",
    version: "<git-sha-ou-semver>",
    environment: "production"
  },
  sessionTracking: { enabled: true, samplingRate: 1.0 },
  webVitalsInstrumentation: { enabled: true }
});
```

### Parâmetros principais

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `url` | Sim | Endpoint do Collector FE |
| `app.name` | Sim | Nome único da aplicação no tenant Elven |
| `app.version` | Recomendado | Para correlação com release |
| `app.environment` | Recomendado | `production`, `staging`, `dev` |
| `sessionTracking.samplingRate` | Não (default `1.0`) | Fração de sessões capturadas |

> **Nota:** Sampling é **por sessão**. Quando uma sessão é amostrada, **todos** os eventos daquela sessão são capturados. Garante visão completa.

---

## React

### Instalação base

```bash
npm install @<sdk-package> @<sdk-react-package>
```

### Inicialização no `main.tsx` / `index.tsx`

```tsx
import { initialize<SDK> } from "@<sdk-package>";
import { ReactErrorBoundary } from "@<sdk-react-package>";

initialize<SDK>({
  url: "https://collector-fe.meusite.com.br/collect",
  app: { name: "checkout-web", version: "1.0.0", environment: "production" }
});

function Root() {
  return (
    <ReactErrorBoundary>
      <App />
    </ReactErrorBoundary>
  );
}
```

### React Router v7 (Data Router)

```tsx
import { create<SDK>RouterV7DataOptions } from "@<sdk-react-package>";

const router = createBrowserRouter(routes, create<SDK>RouterV7DataOptions());
```

### React Router v6

```tsx
import { create<SDK>RouterV6Options } from "@<sdk-react-package>";

// integração via opções específicas v6
```

---

## Next.js

### App Router (Next 13+)

```tsx
// app/layout.tsx
"use client";

import { initialize<SDK> } from "@<sdk-package>";

if (typeof window !== "undefined") {
  initialize<SDK>({
    url: process.env.NEXT_PUBLIC_COLLECTOR_FE_URL!,
    app: { name: "loja-next", version: process.env.NEXT_PUBLIC_VERSION!, environment: "production" }
  });
}
```

### Pages Router

```tsx
// pages/_app.tsx
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      initialize<SDK>({ /* ... */ });
    }
  }, []);

  return <Component {...pageProps} />;
}
```

> **Atenção:** SDK só inicializa no client (`typeof window !== "undefined"`). NÃO importar em código server-only.

---

## Angular

### `app.config.ts` (Angular 17+)

```typescript
import { ApplicationConfig, APP_INITIALIZER } from "@angular/core";
import { initialize<SDK> } from "@<sdk-package>";

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        initialize<SDK>({
          url: environment.collectorFeUrl,
          app: { name: "<app>", version: environment.version, environment: environment.name }
        });
      },
      multi: true
    }
  ]
};
```

---

## Vue.js

### Vue 3

```typescript
// main.ts
import { createApp } from "vue";
import { initialize<SDK> } from "@<sdk-package>";
import App from "./App.vue";

initialize<SDK>({
  url: import.meta.env.VITE_COLLECTOR_FE_URL,
  app: { name: "<app>", version: import.meta.env.VITE_VERSION, environment: "production" }
});

createApp(App).mount("#app");
```

### Vue 2

(Usar plugin Vue compatível ou inicializar antes do `new Vue({...})`.)

---

## Vanilla JavaScript / HTML

### Inline em `<head>`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Minha App</title>
  <script type="module">
    import { initialize<SDK> } from "https://unpkg.com/@<sdk-package>@<version>/dist/index.js";

    initialize<SDK>({
      url: "https://collector-fe.meusite.com.br/collect",
      app: { name: "site-institucional", version: "1.0.0", environment: "production" }
    });
  </script>
</head>
<body>
  <!-- ... -->
</body>
</html>
```

---

## OpenTelemetry Tracing

Para correlacionar fetch/XHR com traces backend:

```typescript
initialize<SDK>({
  url: "https://collector-fe.meusite.com.br/collect",
  app: { /* ... */ },
  instrumentations: {
    tracing: {
      enabled: true,
      propagateCors: ["https://api.meusite.com.br"]
    }
  }
});
```

`propagateCors` deve listar os domínios para os quais o `traceparent` header será enviado. Se o backend deles também está instrumentado com OTel, traces ficam unidos no Tempo Elven.

---

## Identificação do usuário logado

```typescript
import { setUser } from "@<sdk-package>";

setUser({
  id: "user-12345",
  role: "customer"
});
```

> **Cuidado:** Nunca passe CPF, email pessoal, senha, ou token nos atributos do usuário. Use IDs internos. (Ver `reference/style-guide.md` E6.)

---

## Privacidade e dados sensíveis

Checklist:

- [ ] PII removida de `setUser` (use IDs anônimos).
- [ ] URLs não carregam tokens em query string que sejam logados.
- [ ] Console errors não vazam payload sensível.
- [ ] Session replay (se habilitado) tem masking de inputs (`input[type="password"]`, `input[name="cpf"]`).

---

## Troubleshooting

### Eventos não chegam ao Collector FE

**Sintoma.** Network tab mostra requests mas Collector FE não loga.

**Causa provável.** CORS bloqueado ou URL errada.

**Fix.**

1. Verificar `Access-Control-Allow-Origin` no Collector FE.
2. Confirmar URL completa (sem path extra além de `/collect`).
3. Inspecionar response do `OPTIONS` preflight.

### Sessão duplicada / múltiplos `app.name`

**Sintoma.** Mesma página gera 2 sessões ao recarregar.

**Causa provável.** SDK inicializado duas vezes (por StrictMode em React, por hot reload, ou por bundle duplicado).

**Fix.** Confirme inicialização única; em React StrictMode, mover initialize<SDK> para fora do componente raiz.

### Web Vitals zerados

**Sintoma.** Painéis de Web Vitals mostram 0 ou nada.

**Causa provável.** Sampling muito agressivo ou usuário fechou aba antes de eventos serem flushed.

**Fix.**

1. Suba `samplingRate` temporariamente para confirmar coleta.
2. Confirmar que beacon API está habilitado (envio em `pagehide`).

---

## FAQ

### Posso usar com Sentry/NewRelic ao mesmo tempo?

Sim, mas é redundância. Cada SDK adiciona overhead. Decida um para captura de erros JS principal.

### Quanto custa Web Vitals?

Web Vitals é métrica leve (1 evento por sessão). Sem custo extra além da retenção Loki padrão.

### Session replay funciona em mobile?

Funciona em mobile web (Safari iOS, Chrome Android). Apps nativos exigem SDKs específicos (Faro Flutter, etc.).

### O `app.version` precisa ser semver?

Não. Pode ser git SHA, tag de release, ou data de build. Importante é ser único por release pra correlação.
