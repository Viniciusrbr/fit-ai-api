# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`fit-ai-api` — a Fastify (v5) REST API for a fitness app. Users authenticate and create workout plans composed of workout days and exercises. Node 24, ESM (`"type": "module"`), TypeScript, pnpm.

## Commands

- `pnpm dev` — run the server with hot reload (`tsx --watch src/index.ts`)
- `pnpm build` — bundle to `build/` via tsup
- `pnpm lint` — Biome lint
- `pnpm check` — Biome check (lint + format, no writes)
- `pnpm check:fix` — Biome check with autofix
- `pnpm format` — Biome format with writes
- `pnpm prisma migrate dev` / `pnpm prisma generate` — manage DB schema; generation outputs to `src/generated/prisma`

There is no test runner configured.

Biome (not ESLint/Prettier) is the linter/formatter: tab indentation, single quotes, trailing commas everywhere, 100-char line width. Run `pnpm check:fix` before considering work done.

## Environment

Requires a `.env` (loaded via `dotenv/config`):
- `DATABASE_URL` — PostgreSQL connection string (read directly by `prisma.config.ts` and `src/lib/db.ts`, **not** validated by the env schema)
- `PORT` (default 8081), `API_BASE_URL` (default `http://localhost:8081`) — validated by Zod in `src/lib/env.ts`

When adding new env vars, add them to `src/lib/env.ts` so they are validated at startup, and import from `env` rather than reading `process.env` directly.

## Architecture

Request flow: **route → use case → Prisma**. Layers:

- `src/index.ts` — app entry. Registers plugins in order: zod type provider compilers, Swagger, route modules, Scalar API reference (`/docs`), CORS, and the BetterAuth catch-all (`/api/auth/*`). Top-level `await` is used throughout.
- `src/routes/*.ts` — Fastify route plugins registered with a URL prefix in `index.ts`. Each route authenticates by calling `auth.api.getSession`, then delegates to a use case. Routes own HTTP concerns: auth guard (401), error→status mapping, status codes.
- `src/useCases/*.ts` — business logic as classes with an `execute(dto)` method taking an `InputDto` and returning an `OutputDto`. These talk to Prisma directly today (see the TODO in `create-workout-plan.ts` about extracting a repository).
- `src/schemas/index.ts` — Zod schemas shared between request validation and OpenAPI generation.
- `src/errors/index.ts` — custom error classes (e.g. `NotFoundError`); routes `instanceof`-check these to map to HTTP statuses.
- `src/lib/` — `db.ts` (Prisma client singleton via the pg driver adapter, cached on `global` outside production), `auth.ts` (BetterAuth config), `env.ts` (validated env).

### Validation & OpenAPI

Uses `fastify-type-provider-zod`. Routes are declared with `.withTypeProvider<ZodTypeProvider>()` and Zod schemas in `schema.body`/`schema.response`; the compilers are set globally in `index.ts`. Schemas double as the OpenAPI spec. Reusing a schema across request and response is the established pattern — e.g. `WorkoutPlanSchema.omit({ id: true })` for the create body.

### Authentication

BetterAuth with email/password, Prisma adapter, and the `openAPI` plugin. All auth endpoints are served by a single catch-all route in `index.ts` that bridges Fastify ↔ the Web Fetch `Request`/`Response` API. To protect a route, call `auth.api.getSession({ headers: fromNodeHeaders(request.headers) })` and return 401 if null (see `workout-plan.ts`). Trusted origins / CORS origins are hardcoded to `localhost:3000` and `localhost:8081` in both `auth.ts` and `index.ts` — keep them in sync.

### Database

PostgreSQL via Prisma 7 with the `@prisma/adapter-pg` driver adapter. The generated client lives in `src/generated/prisma` (committed, imported as `../generated/prisma/client.js`) — do not hand-edit it; regenerate after schema changes. Domain models: `WorkoutPlan` → `WorkoutDay` → `WorkoutExercise`, plus `WorkoutSession`; BetterAuth owns `User`/`Session`/`Account`/`Verification`. A user has at most one active plan: creating a new plan deactivates the prior active one inside a `$transaction` for atomicity.

## Conventions

- Path alias `@/*` → `src/*` (defined in `tsconfig.json`). Prefer `@/...` imports for `src` modules.
- Code comments and some domain notes are written in Portuguese (pt-BR); match the surrounding language.