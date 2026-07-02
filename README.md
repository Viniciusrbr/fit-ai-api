# 🚀 Fit.ai API

API REST do **Fit.ai**, um aplicativo de fitness que ajuda pessoas — especialmente iniciantes em musculação — a criar, gerenciar e acompanhar planos de treino. A API expõe também um **personal trainer virtual com IA** capaz de montar planos personalizados e tirar dúvidas sobre treino.

**Problema que resolve:** montar um plano de treino coerente (divisão de grupos musculares, séries, repetições, descanso) e manter constância exige conhecimento técnico e disciplina. O Fit.ai concentra tudo isso em um só lugar: geração assistida por IA de planos completos, execução das sessões de treino e métricas de consistência para manter o usuário engajado.

> ✅ **Status: Concluído e em produção.** O projeto está **funcional** e disponível para acesso.
>
> 🔗 **Acesse a aplicação:** [fit-ai.viniciusrbr.dev/auth](https://fit-ai.viniciusrbr.dev/auth)
>
> 🔧 A aplicação segue **evoluindo**: atualmente passa por etapas de melhoria contínua — refatorações, melhorias de código, ajustes de arquitetura e otimizações (ver [Possíveis Melhorias](#-possíveis-melhorias)).

---

# 📋 Sobre o Projeto

O `fit-ai-api` é o back-end de uma aplicação de fitness. Suas responsabilidades centrais são:

- **Autenticação de usuários** (login social via Google).
- **Planos de treino**: um usuário cria planos compostos por dias de treino (`WorkoutDay`), e cada dia contém exercícios (`WorkoutExercise`). Um usuário tem no máximo **um plano ativo** por vez.
- **Sessões de treino** (`WorkoutSession`): registra o início e a conclusão de um treino em um determinado dia.
- **Dados de treino do usuário**: peso, altura, idade e percentual de gordura corporal.
- **Estatísticas e home**: streak (sequência) de treinos, taxa de conclusão, tempo total treinado e consistência por dia.
- **Chat com IA**: um agente (Google Gemini) que conversa com o usuário, cadastra seus dados físicos e monta planos de treino automaticamente através de _tools_.

### Domínio de negócio

O modelo de domínio segue a hierarquia:

```
WorkoutPlan (plano) → WorkoutDay (dia da semana) → WorkoutExercise (exercício)
                            └── WorkoutSession (sessão executada)
```

### Integração

A API foi desenhada para servir uma aplicação **Front-end web** (ver seção abaixo). A comunicação é feita via HTTP/JSON, com autenticação baseada em cookies de sessão do BetterAuth (com suporte a cookies cross-subdomain em produção). O endpoint de IA (`POST /ai`) responde via _streaming_ compatível com o protocolo de UI messages do Vercel AI SDK.

---

# 🔗 Front-end

A aplicação cliente é o **Fit.ai Web**, uma interface web que consome esta API para autenticação, gerenciamento de planos de treino, execução de sessões, visualização de estatísticas e o chat com o personal trainer virtual.

- **Repositório Front-end:** [https://github.com/Viniciusrbr/fit-ai-web](https://github.com/Viniciusrbr/fit-ai-web)

### Como o Front-end consome esta API

- Faz requisições HTTP/JSON aos endpoints REST documentados abaixo.
- Autentica-se pelos endpoints do BetterAuth (`/api/auth/*`), utilizando **cookies de sessão** (as requisições são feitas com `credentials: 'include'`, e o CORS da API está configurado com `credentials: true` para a origem do front definida em `WEB_APP_BASE_URL`).
- Consome o endpoint de IA (`POST /ai`) em modo _streaming_, renderizando as mensagens do agente em tempo real.

> **Observação:** as tecnologias específicas utilizadas no Front-end não fazem parte deste repositório e devem ser consultadas diretamente no repositório do Fit.ai Web.

---

# 🛠 Tecnologias Utilizadas

| Tecnologia | Função |
| ---------- | ------ |
| **Node.js 24 (ESM)** | Runtime JavaScript. O projeto usa ES Modules (`"type": "module"`) e top-level `await`. |
| **TypeScript** | Linguagem principal, com _target_ ES2024 e modo `strict`. |
| **Fastify 5** | Framework web de alto desempenho que serve as rotas HTTP. |
| **fastify-type-provider-zod** | Integra o Zod ao Fastify para validação de request/response e geração do schema OpenAPI. |
| **Zod v4** | Validação e tipagem de dados de entrada e saída; os schemas também alimentam a documentação OpenAPI. |
| **Prisma 7** | ORM para PostgreSQL. O client é gerado em `src/generated/prisma`. |
| **@prisma/adapter-pg** | Driver adapter (`pg`) usado pelo Prisma para conectar ao PostgreSQL. |
| **PostgreSQL** | Banco de dados relacional. |
| **BetterAuth** | Autenticação (login social com Google) e geração do schema OpenAPI de auth via plugin `openAPI`. |
| **@ai-sdk/google** + **ai (Vercel AI SDK)** | Integração com o modelo **Google Gemini 2.5 Flash** para o personal trainer virtual, incluindo suporte a _tools_ e _streaming_. |
| **@fastify/swagger** + **@scalar/fastify-api-reference** | Geração da especificação OpenAPI e interface de documentação interativa em `/docs`. |
| **@fastify/cors** | Configuração de CORS. |
| **dayjs** | Manipulação e formatação de datas (com plugin `utc`). |
| **dotenv** | Carregamento de variáveis de ambiente a partir do `.env`. |
| **pino-pretty** | Formatação legível dos logs em ambiente de desenvolvimento. |
| **Biome** | Linter e formatter (substitui ESLint/Prettier). |
| **tsx** | Execução do TypeScript em desenvolvimento com _hot reload_. |
| **Docker** | Containerização da aplicação (build multi-stage) e do banco de dados (via Docker Compose). |
| **pnpm** | Gerenciador de pacotes. |

> **Testes:** não há _runner_ de testes configurado neste repositório.

---

# 🏗 Arquitetura

O projeto segue uma arquitetura em camadas com **Service Layer Pattern** na forma de **Use Cases**, com forte inspiração em princípios de _Clean Architecture_ (desacoplamento entre camada de negócio e infraestrutura via DTOs).

### Fluxo das requisições

```
Rota (route) → Caso de Uso (use case) → Prisma → PostgreSQL
```

- **Rotas (`src/routes/`)** — plugins Fastify registrados com um prefixo de URL em `src/index.ts`. Cuidam apenas de **concerns HTTP**: validação de dados (com Zod), autenticação (guarda de sessão, 401), mapeamento de erros para status codes e definição dos status de resposta. **Não contêm regra de negócio.**
- **Casos de Uso (`src/useCases/`)** — concentram **toda a regra de negócio**. São classes nomeadas com verbos, com um único método `execute(dto)` que recebe um `InputDto` e retorna um `OutputDto`. Convertem o resultado do Prisma para o `OutputDto`, **nunca** retornando o model do Prisma diretamente (garantindo desacoplamento). Falam com o Prisma diretamente.
- **Schemas (`src/schemas/index.ts`)** — schemas Zod compartilhados entre validação de requisição e geração de OpenAPI.
- **Erros (`src/errors/index.ts`)** — classes de erro customizadas (`NotFoundError`, `WorkoutPlanNotActiveError`, `SessionAlreadyStartedError`) lançadas pelos use cases e mapeadas para status HTTP nas rotas.
- **Lib (`src/lib/`)** — infraestrutura: `db.ts` (singleton do Prisma Client), `auth.ts` (configuração do BetterAuth) e `env.ts` (validação das variáveis de ambiente com Zod).

### Padrões identificados

- **Service Layer Pattern / Use Case Pattern** — lógica de negócio isolada em classes de caso de uso.
- **DTO Pattern** — entrada e saída dos use cases sempre tipadas por interfaces `InputDto`/`OutputDto`.
- **Desacoplamento (Clean Architecture)** — os use cases mapeiam explicitamente o resultado do banco para DTOs.

> **Observação:** **não** há _Controllers_ tradicionais (as rotas Fastify cumprem esse papel), **não** há camada de _Repository_ (por decisão de projeto, os use cases chamam o Prisma diretamente) e **não** há framework de injeção de dependências — os use cases são instanciados diretamente nas rotas.

---

# 📂 Estrutura de Pastas

```text
.
├── prisma/
│   ├── migrations/          # Migrations do banco (SQL)
│   └── schema.prisma        # Schema do Prisma (modelos e enums)
├── public/
│   └── db.png               # Diagrama do banco de dados
├── src/
│   ├── errors/              # Classes de erro customizadas
│   ├── generated/prisma/    # Prisma Client gerado (não editar manualmente)
│   ├── lib/                 # Infraestrutura: db, auth, env
│   ├── routes/              # Plugins de rota Fastify (concerns HTTP)
│   ├── schemas/             # Schemas Zod (validação + OpenAPI)
│   ├── useCases/            # Casos de uso (regra de negócio)
│   └── index.ts             # Entry point: registra plugins e rotas
├── Dockerfile               # Build multi-stage da aplicação
├── docker-compose.yml       # PostgreSQL para desenvolvimento
├── prisma.config.ts         # Configuração do Prisma
├── biome.json               # Configuração do Biome (lint/format)
└── tsconfig.json
```

| Pasta | Responsabilidade |
| ----- | ---------------- |
| `prisma/` | Schema, enums e migrations do banco de dados. |
| `src/errors/` | Erros de domínio customizados usados pelos use cases e mapeados nas rotas. |
| `src/generated/prisma/` | Client gerado automaticamente pelo Prisma (versionado; não editar à mão). |
| `src/lib/` | Componentes de infraestrutura: conexão com o banco, autenticação e validação de env. |
| `src/routes/` | Definição das rotas HTTP, validação, autenticação e tratamento de erros. |
| `src/schemas/` | Schemas Zod reutilizados por request, response e documentação OpenAPI. |
| `src/useCases/` | Toda a lógica de negócio da aplicação. |

---

# 🔐 Autenticação e Autorização

A autenticação é feita com **BetterAuth**, usando o adapter do Prisma sobre PostgreSQL.

### O que está implementado

- **Login social com Google (OAuth)** — configurado em `src/lib/auth.ts` com `prompt: 'select_account'`.
- **Sessões** — o BetterAuth gerencia sessões persistidas no banco (tabela `session`, com `token`, `expiresAt`, `ipAddress`, `userAgent`).
- **Cookies cross-subdomain** — habilitados em produção para o domínio `.viniciusrbr.dev` (em desenvolvimento, sem domínio explícito).
- **Endpoints de auth** — servidos por uma rota _catch-all_ (`/api/auth/*`) em `src/index.ts`, que faz a ponte entre o Fastify e a API Web Fetch (`Request`/`Response`) esperada pelo BetterAuth.
- **Plugin OpenAPI do BetterAuth** — expõe o schema de auth (disponível na documentação em `/docs`).

### Como as rotas são protegidas

Cada rota protegida recupera a sessão com:

```ts
const session = await auth.api.getSession({
  headers: fromNodeHeaders(request.headers),
});
if (!session) {
  return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
}
```

O `session.user.id` é então repassado aos use cases, que garantem que o usuário só acesse os próprios recursos (ex.: `workoutPlan.userId !== dto.userId` → `NotFoundError`).

### O que **não** está implementado

- **Não** há JWT emitido pela aplicação (a autenticação é baseada em cookies/sessão do BetterAuth).
- **Não** há sistema de _roles_, _permissions_ ou RBAC. A autorização é feita apenas por posse do recurso (o recurso pertence ao usuário autenticado).
- **Não** há login por email/senha configurado no código — apenas o provedor social Google está habilitado.

---

# 🗄 Banco de Dados

- **Banco:** PostgreSQL (via Prisma 7 com o driver adapter `@prisma/adapter-pg`).
- **Migrations:** gerenciadas pelo Prisma, em `prisma/migrations/`. A migration inicial é `20260702160726_init`.
- **Seeds:** **não** há seeds configurados no projeto.
- **Diagrama:** disponível em `public/db.png`.

### Principais entidades

| Tabela | Descrição | Campos principais |
| ------ | --------- | ----------------- |
| `user` | Usuário e seus dados de treino. | `id`, `name`, `email`, `emailVerified`, `image`, `weightInGrams`, `heightInCentimeters`, `age`, `bodyFatPercentage` |
| `WorkoutPlan` | Plano de treino de um usuário. | `id`, `name`, `userId`, `isActive` |
| `WorkoutDay` | Dia da semana de um plano. | `id`, `name`, `workoutPlanId`, `weekDay`, `isRest`, `estimatedDurationInSeconds`, `coverImageUrl` |
| `WorkoutExercise` | Exercício de um dia de treino. | `id`, `name`, `order`, `workoutDayId`, `sets`, `reps`, `restTimeInSeconds` |
| `WorkoutSession` | Sessão de treino executada. | `id`, `workoutDayId`, `startedAt`, `completedAt` |
| `session` | Sessões de autenticação (BetterAuth). | `id`, `token`, `expiresAt`, `userId`, `ipAddress`, `userAgent` |
| `account` | Contas/provedores de login (BetterAuth). | `id`, `accountId`, `providerId`, `userId`, tokens OAuth |
| `verification` | Tokens de verificação (BetterAuth). | `id`, `identifier`, `value`, `expiresAt` |

**Enum `WeekDay`:** `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`.

### Relacionamentos

- `User` **1—N** `WorkoutPlan` (um usuário tem vários planos; no máximo um ativo por vez).
- `WorkoutPlan` **1—N** `WorkoutDay`.
- `WorkoutDay` **1—N** `WorkoutExercise`.
- `WorkoutDay` **1—N** `WorkoutSession`.
- `User` **1—N** `Session` e `Account` (BetterAuth).
- Todas as relações usam `onDelete: Cascade`.

> **Regra de negócio:** ao criar um novo plano, o plano ativo anterior é desativado dentro de uma `$transaction` (garantindo atomicidade), de modo que apenas um plano permaneça ativo.

---

# 🌐 Endpoints da API

Todas as rotas de negócio abaixo exigem **autenticação** (sessão válida), retornando `401` caso contrário.

### Workout Plans (prefixo `/workout-plans`)

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| GET | `/workout-plans` | Lista os planos de treino do usuário. Aceita query `?active=true|false` para filtrar por status. |
| GET | `/workout-plans/:id` | Retorna um plano de treino por ID (com resumo dos dias e contagem de exercícios). |
| GET | `/workout-plans/:workoutPlanId/days/:workoutDayId` | Retorna um dia de treino com seus exercícios e sessões. |
| POST | `/workout-plans` | Cria um novo plano de treino (desativa o plano ativo anterior). |
| POST | `/workout-plans/:workoutPlanId/days/:workoutDayId/sessions` | Inicia uma sessão de treino para um dia. |
| PATCH | `/workout-plans/:workoutPlanId/days/:workoutDayId/sessions/:workoutSessionId` | Atualiza uma sessão (ex.: marca `completedAt`). |

### Home (prefixo `/home`)

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| GET | `/home/:date` | Dados da home para a data informada (`YYYY-MM-DD`): plano ativo, treino do dia, streak e consistência. |

### Stats (prefixo `/stats`)

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| GET | `/stats?from=YYYY-MM-DD&to=YYYY-MM-DD` | Estatísticas de treino no período: streak, consistência por dia, treinos concluídos, taxa de conclusão e tempo total. |

### User (prefixo `/me`)

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| GET | `/me` | Dados de treino do usuário autenticado (peso, altura, idade, % de gordura). Pode retornar `null`. |

### AI (prefixo `/ai`)

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| POST | `/ai` | Chat com o personal trainer virtual (Google Gemini). Resposta em _streaming_. Suporta _tools_: buscar/atualizar dados do usuário, listar e criar planos de treino. |

### Autenticação & Documentação

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| GET/POST | `/api/auth/*` | Endpoints do BetterAuth (login social, sessão, etc.). |
| GET | `/docs` | Documentação interativa da API (Scalar). |
| GET | `/swagger.json` | Especificação OpenAPI em JSON. |

---

# 📨 Exemplos de Requisição

> As rotas autenticadas dependem do cookie de sessão emitido pelo BetterAuth. Os exemplos abaixo assumem que o cookie de sessão é enviado junto à requisição.

### Listar planos de treino ativos

```bash
curl -X GET "http://localhost:8080/workout-plans?active=true" \
  --cookie "better-auth.session_token=SEU_TOKEN_DE_SESSAO"
```

### Criar um plano de treino

```bash
curl -X POST "http://localhost:8080/workout-plans" \
  -H "Content-Type: application/json" \
  --cookie "better-auth.session_token=SEU_TOKEN_DE_SESSAO" \
  -d '{
    "name": "Plano Full Body",
    "workoutDays": [
      {
        "name": "Segunda - Full Body",
        "weekDay": "MONDAY",
        "isRest": false,
        "estimatedDurationInSeconds": 3600,
        "exercises": [
          {
            "order": 0,
            "name": "Agachamento Livre",
            "sets": 4,
            "reps": 10,
            "restTimeInSeconds": 90
          }
        ]
      }
    ]
  }'
```

### Iniciar uma sessão de treino

```bash
curl -X POST "http://localhost:8080/workout-plans/PLAN_ID/days/DAY_ID/sessions" \
  --cookie "better-auth.session_token=SEU_TOKEN_DE_SESSAO"
```

### Concluir uma sessão de treino (fetch)

```javascript
await fetch(
  `http://localhost:8080/workout-plans/${planId}/days/${dayId}/sessions/${sessionId}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ completedAt: new Date().toISOString() }),
  },
);
```

### Buscar estatísticas de um período

```bash
curl -X GET "http://localhost:8080/stats?from=2026-06-01&to=2026-06-30" \
  --cookie "better-auth.session_token=SEU_TOKEN_DE_SESSAO"
```

---

# ⚙️ Variáveis de Ambiente

Validadas em `src/lib/env.ts` com Zod na inicialização (a aplicação não sobe se alguma obrigatória estiver ausente/inválida).

| Variável | Obrigatória | Descrição |
| -------- | ----------- | --------- |
| `PORT` | Não (default `8080`) | Porta em que o servidor escuta. |
| `DATABASE_URL` | Sim | URL de conexão com o PostgreSQL (deve começar com `postgresql://`). Lida também pelo `prisma.config.ts`. |
| `BETTER_AUTH_SECRET` | Sim | Segredo usado pelo BetterAuth para assinar sessões. |
| `API_BASE_URL` | Não (default `http://localhost:8080`) | URL base pública da API (usada pelo BetterAuth e na doc OpenAPI). |
| `GOOGLE_CLIENT_ID` | Sim | Client ID do OAuth do Google. |
| `GOOGLE_CLIENT_SECRET` | Sim | Client Secret do OAuth do Google. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Sim | Chave de API do Google Generative AI (Gemini) usada pelo endpoint de IA. |
| `OPENAI_API_KEY` | Não (opcional) | Chave da OpenAI (dependência instalada; opcional no schema de env). |
| `WEB_APP_BASE_URL` | Sim | URL do Front-end; usada como origem confiável (CORS/trustedOrigins). |
| `NODE_ENV` | Não (default `development`) | Ambiente: `development`, `production` ou `test`. |

> O `.env.example` também referencia `BETTER_AUTH_URL`, mas essa variável **não** é lida pelo schema de env atual (`src/lib/env.ts`).

Exemplo de `.env` para desenvolvimento local (usando o Postgres do Docker Compose):

```env
PORT=8080
DATABASE_URL=postgresql://postgres:password@localhost:5432/fit-ai-db
BETTER_AUTH_SECRET=uma_string_secreta_aleatoria
API_BASE_URL=http://localhost:8080
WEB_APP_BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_GENERATIVE_AI_API_KEY=sua_chave_gemini
NODE_ENV=development
```

---

# 🚀 Como Executar o Projeto

## Pré-requisitos

- **Node.js 24.x** (definido em `engines`; `engine-strict=true` no `.npmrc`).
- **pnpm 11.6.0** (definido em `packageManager`).
- **PostgreSQL** (ou Docker, para subir o banco localmente).

## Instalação

```bash
git clone https://github.com/Viniciusrbr/fit-ai-back-end.git
cd back-end
```

## Instalação das dependências

```bash
pnpm install
```

> O `postinstall`/build gera o Prisma Client. Caso necessário, gere manualmente com `pnpm prisma generate`.

## Configuração do ambiente

1. Crie um arquivo `.env` na raiz (use o `.env.example` como referência e a tabela de variáveis acima).
2. Suba o banco de dados (via Docker Compose, opcional):

   ```bash
   docker compose up -d
   ```

3. Aplique as migrations:

   ```bash
   pnpm prisma migrate dev
   ```

## Execução em desenvolvimento

```bash
pnpm dev
```

Servidor com _hot reload_ via `tsx --watch`. A documentação fica disponível em `http://localhost:8080/docs`.

## Execução em produção

```bash
pnpm build      # gera o Prisma Client, compila com tsc e resolve os aliases (saída em dist/)
node dist/index.js
```

## Execução com Docker

O `Dockerfile` usa build multi-stage (base → deps → build → production) e inicia com `node dist/index.js`.

```bash
docker build -t fit-ai-api .
docker run -p 8080:8080 --env-file .env fit-ai-api
```

> O `docker-compose.yml` deste repositório provisiona **apenas o PostgreSQL** para desenvolvimento (usuário `postgres`, senha `password`, banco `fit-ai-db`), não a aplicação.

---

# 🧪 Testes

**Não há testes configurados** neste repositório — não existe _test runner_ nem scripts de teste no `package.json`. A garantia de qualidade atual se apoia em:

- **Tipagem estática** (TypeScript em modo `strict`).
- **Validação em runtime** de todas as entradas/saídas com Zod.
- **Lint e format** com Biome.

---

# 📦 Scripts Disponíveis

Definidos no `package.json`:

| Script | Comando | Descrição |
| ------ | ------- | --------- |
| `pnpm dev` | `tsx --watch src/index.ts` | Sobe o servidor em desenvolvimento com _hot reload_. |
| `pnpm build` | `prisma generate && tsc && tsc-alias ...` | Gera o Prisma Client, compila o TypeScript e resolve os aliases de path (saída em `dist/`). |
| `pnpm lint` | `biome lint .` | Executa o linter (Biome). |
| `pnpm check` | `biome check .` | Roda lint + format sem escrever (verificação). |
| `pnpm check:fix` | `biome check --write .` | Roda lint + format aplicando correções automáticas. |
| `pnpm format` | `biome format --write .` | Formata o código. |

Scripts úteis do Prisma (via CLI):

```bash
pnpm prisma generate      # Gera o Prisma Client
pnpm prisma migrate dev   # Cria/aplica migrations em desenvolvimento
pnpm prisma studio        # Abre o Prisma Studio (GUI do banco)
```

---

# ☁️ Deploy

O projeto está preparado para deploy via **container Docker**:

- **`Dockerfile`** — build multi-stage baseado em `node:24-slim`, com `corepack`/`pnpm`. Estágios: `base` (dependências de sistema e cópia de `package.json`/`prisma`), `deps` (instalação com _frozen lockfile_), `build` (`pnpm run build`) e `production` (instala apenas dependências de produção e copia `dist/`). O container inicia com `node dist/index.js` e a aplicação escuta em `0.0.0.0:PORT`.
- **`docker-compose.yml`** — provisiona o PostgreSQL para desenvolvimento local.

A configuração de cookies cross-subdomain para o domínio `.viniciusrbr.dev` em produção (`src/lib/auth.ts`) indica que a API é hospedada sob esse domínio. **Não** há, no repositório, arquivos de configuração específicos de plataformas como Railway, Render, Vercel, AWS, Azure ou Google Cloud.

---

# 🔒 Segurança

Práticas de segurança identificadas no código:

- **Autenticação delegada ao BetterAuth** — sessões persistidas, tokens gerenciados pela biblioteca; **não** há armazenamento manual de senhas na aplicação (login é via Google OAuth).
- **CORS restritivo** — `@fastify/cors` configurado com origem específica (`WEB_APP_BASE_URL`) e `credentials: true`; `trustedOrigins` no BetterAuth também restrito.
- **Cookies de sessão** — com suporte a cross-subdomain apenas em produção, sob domínio definido.
- **Validação de entrada** — todas as entradas (body, params, query) são validadas com Zod (`z.uuid()`, `z.iso.date()`, `z.iso.datetime()`, ranges numéricos etc.), o que também mitiga entradas malformadas.
- **Validação de variáveis de ambiente** — `src/lib/env.ts` falha rápido no startup se algo obrigatório faltar.
- **Proteção contra SQL Injection** — uso do Prisma ORM (queries parametrizadas), sem SQL cru concatenado.
- **Autorização por posse de recurso** — os use cases verificam que o recurso pertence ao `userId` da sessão antes de retorná-lo.

Pontos **não** implementados / observações:
- **Não** há _rate limiting_ configurado.
- **Não** há sanitização/escape adicional voltada a XSS além da validação de tipos (a API é JSON; a proteção contra XSS depende também do Front-end).
- O `docker-compose.yml` usa credenciais de banco padrão (`postgres`/`password`) — adequadas apenas para desenvolvimento local.

---

# 📈 Possíveis Melhorias

- **Testes:** adicionar testes unitários (use cases) e de integração (rotas), com um _runner_ como Vitest.
- **Rate limiting:** proteger endpoints (especialmente `/ai` e `/api/auth/*`) contra abuso com `@fastify/rate-limit`.
- **Observabilidade/Monitoramento:** métricas (Prometheus), tracing distribuído (OpenTelemetry) e um _health check_ dedicado; hoje há apenas logs via Pino.
- **Camada de repositório:** extrair o acesso ao Prisma dos use cases para repositórios, facilitando testes e troca de infraestrutura.
- **Performance/Escalabilidade:** cache (ex.: Redis) para dados de home/stats; paginação na listagem de planos; revisão de índices no banco.
- **Segurança:** headers de segurança (`@fastify/helmet`), rotação de segredos e credenciais de banco fortes em todos os ambientes.
- **Consistência de configuração:** alinhar `.env.example` com o schema de env real (ex.: `BETTER_AUTH_URL` não é usada) e centralizar origens de CORS/trustedOrigins.
- **Deploy:** adicionar CI/CD e, se aplicável, `docker-compose` completo (app + banco) ou manifests da plataforma-alvo.

---
