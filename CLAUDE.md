# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`fit-ai-api` — a Fastify (v5) REST API for a fitness app. Users authenticate and create workout plans composed of workout days and exercises. Node 24, ESM (`"type": "module"`), TypeScript, pnpm.

## Commands

- `pnpm dev` — run the server with hot reload (`tsx --watch src/server.ts`)
- `pnpm build` — `prisma generate` + `tsc -p tsconfig.build.json` + `tsc-alias` (outputs to `dist/`)
- `pnpm test` — unit tests (Vitest, `src/test/use-cases`)
- `pnpm test:watch` — unit tests in watch mode
- `pnpm test:e2e` — e2e tests (supertest; requires a reachable `DATABASE_URL` — each file runs in an isolated Postgres schema, serially)
- `pnpm test:all` — unit + e2e
- `pnpm lint` — Biome lint
- `pnpm check` — Biome check (lint + format, no writes)
- `pnpm check:fix` — Biome check with autofix
- `pnpm format` — Biome format with writes
- `pnpm prisma migrate dev` / `pnpm prisma generate` — manage DB schema; generation outputs to `src/generated/prisma`

Biome (not ESLint/Prettier) is the linter/formatter: tab indentation, single quotes, trailing commas everywhere, 100-char line width. Run `pnpm check:fix` before considering work done.

## Environment

Requires a `.env` (loaded via `dotenv/config`). All vars are validated by Zod in `src/env/index.ts` (`safeParse`, throws on invalid) — including `DATABASE_URL`. `PORT` defaults to 8080; `API_BASE_URL` defaults to `http://localhost:8080` (the local `.env` uses 8081).

When adding new env vars, add them to `src/env/index.ts` and import from `@/env` rather than reading `process.env` directly (the e2e setup is the only exception).

## Architecture

Dependency rule: **controller → use case → repository interface**. Concrete Prisma repositories are only known by the factories. See `.claude/rules/architecture.md` for the full rules and examples.

- `src/app.ts` — builds the Fastify app: zod type provider compilers, the central `setErrorHandler`, Swagger, route modules, Scalar API reference (`/docs`), CORS, and the BetterAuth catch-all (`/api/auth/*`). Top-level `await` is used throughout. Exports `app` (used by e2e tests).
- `src/server.ts` — app entry; only `app.listen`.
- `src/controllers/<resource>/` — one thin handler per action (`<action>.ts`), resource Zod schemas with inferred types (`schemas.ts`), and route registration (`routes.ts`). Protected routes use `onRequest: [verifyAuth]`; handlers read `request.user`. Controllers catch domain errors and map them to HTTP statuses; anything else is re-thrown to the central error handler.
- `src/use-cases/` — business logic as classes (`<Name>UseCase`) with constructor-injected repository interfaces and a single `execute(request)` method typed with `<Name>UseCaseRequest`/`<Name>UseCaseResponse`. Domain errors in `use-cases/errors/` (one file per error); factories in `use-cases/factories/` (`make-<name>-use-case.ts`).
- `src/repositories/` — repository interfaces at the root, Prisma implementations in `prisma/`, in-memory implementations for unit tests in `in-memory/`.
- `src/middlewares/verify-auth.ts` — BetterAuth session check; sends 401 or populates `request.user` (typed via `src/@types/fastify.d.ts`).
- `src/schemas/index.ts` — shared `ErrorSchema` (`{ error, code }`); per-resource schemas live with their controllers.
- `src/lib/` — `prisma.ts` (Prisma client singleton via the pg driver adapter, cached on `global` outside production; honors a `?schema=` param in `DATABASE_URL` for test isolation), `auth.ts` (BetterAuth config), `ai-model.ts` (AI SDK model with rate-limit fallback).

### Error handling

Central `setErrorHandler` in `app.ts`: Zod request validation → 400 `VALIDATION_ERROR`; response serialization errors → 500; errors with `statusCode < 500` keep their status; fallback → 500. Error response shape is always `{ error, code }` — do not change it without aligning with the front end.

### Validation & OpenAPI

Uses `fastify-type-provider-zod` (Zod v4). Routes are declared with `.withTypeProvider<ZodTypeProvider>()` and Zod schemas in `schema.body`/`schema.params`/`schema.querystring`/`schema.response`, plus `operationId`/`tags`/`summary`; the compilers are set globally in `app.ts`. Schemas double as the OpenAPI spec.

### Authentication

BetterAuth with email/password and Google, Prisma adapter, and the `openAPI` plugin. All auth endpoints are served by a single catch-all route in `app.ts` that bridges Fastify ↔ the Web Fetch `Request`/`Response` API. To protect a route, add `onRequest: [verifyAuth]` (`src/middlewares/verify-auth.ts`). Trusted origins / CORS come from `WEB_APP_BASE_URL` in the env.

### Database

PostgreSQL via Prisma 7 with the `@prisma/adapter-pg` driver adapter. The generated client lives in `src/generated/prisma` (git-ignored; regenerated on install/build) — do not hand-edit it; regenerate after schema changes. Domain models: `WorkoutPlan` → `WorkoutDay` → `WorkoutExercise`, plus `WorkoutSession`; BetterAuth owns `User`/`Session`/`Account`/`Verification`. A user has at most one active plan: `PrismaWorkoutPlansRepository.create` deactivates the prior active plan (scoped by `userId`) inside a `$transaction`.

### Tests

Vitest with two projects (`vitest.config.ts`): `unit` (`src/test/use-cases`, in-memory repositories, SUT pattern) and `e2e` (`src/test/e2e/controllers/<resource>/<action>.test.ts`, supertest against `app.server`). Each e2e file gets its own Postgres schema (created by `prisma db push` in `src/test/e2e/setup-e2e.ts`, dropped after); files run serially. Helpers: `createAndAuthenticateUser`, `createTestWorkoutPlan`.

## Conventions

- Path alias `@/*` → `src/*` (defined in `tsconfig.json`). Prefer `@/...` imports for `src` modules.
- Code comments and some domain notes are written in Portuguese (pt-BR); match the surrounding language.
