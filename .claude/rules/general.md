# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Stack

- Node.js (ES modules)
- pnpm como package manager
- TypeScript (target ES2024)
- Fastify com Zod type provider
- Prisma ORM com PostgreSQL (usando pg adapter)
- better-auth para autenticação
- Zod v4
- Vitest (unit + e2e com supertest)
- Biome (lint/format)

## Comandos

```bash
# Desenvolvimento
pnpm dev                    # Inicia servidor dev com watch mode (tsx --watch src/server.ts)

# Build
pnpm build                  # prisma generate + tsc + tsc-alias (saída em dist/)

# Testes
pnpm test                   # Testes unitários (Vitest)
pnpm test:e2e               # Testes e2e (requer DATABASE_URL acessível)
pnpm test:all               # Unitários + e2e

# Banco de dados
pnpm prisma generate        # Gera o Prisma client
pnpm prisma migrate dev     # Executa migrations em desenvolvimento
pnpm prisma studio          # Abre o Prisma Studio GUI

# Linting
pnpm check:fix              # Biome check com autofix (rodar antes de finalizar)
```

## Arquitetura

Camadas: **controller -> use case -> interface de repositório** (implementações Prisma só nas factories). Estrutura completa, regras e exemplos em `.claude/rules/architecture.md`.

- `src/controllers/<recurso>/` - handlers HTTP finos, schemas Zod do recurso e rotas
- `src/use-cases/` - regra de negócio (+ `errors/` e `factories/`)
- `src/repositories/` - interfaces + implementações `prisma/` e `in-memory/`
- `src/middlewares/` - `verify-auth.ts` (BetterAuth)
- `src/env/` - validação das variáveis de ambiente
- `src/lib/` - `prisma.ts`, `auth.ts`, `ai-model.ts`
- `src/test/` - `use-cases/` (unitários) e `e2e/`
- `src/generated/` - Prisma client gerado automaticamente (não editar)
- `prisma/` - Schema e migrations do Prisma

### Documentação da API

Scalar API Reference disponível em `/docs` quando o servidor está rodando (porta definida em `PORT`, 8081 no `.env` local).

## MCPs

- **SEMPRE** use Context7 para buscar documentações
- **SEMPRE** use Serena para semantic code retrieval e editing tools.
