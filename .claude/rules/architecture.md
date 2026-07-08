# Arquitetura

Regra de dependência entre camadas: **HTTP (controller) -> use case -> interface de repositório**. Implementações concretas (Prisma) só são conhecidas pelas factories.

## Git

- **SEMPRE** use [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit. Exemplo: `feat: add start workout session endpoint`, `fix: workout plan validation`, `docs: update architecture rules`.
- **NUNCA** faça commit sem a permissão explícita do usuário. Sempre aguarde o usuário pedir para commitar.

## Estrutura de pastas (`src/`)

```
controllers/<recurso>/
  <acao>.ts        -> handler HTTP fino (1 arquivo por ação)
  schemas.ts       -> schemas Zod do recurso + tipos inferidos
  routes.ts        -> registra as rotas do recurso
use-cases/
  <nome>.ts        -> classe com a regra de negócio
  errors/          -> erros de domínio (1 arquivo por erro)
  factories/       -> make-<nome>-use-case.ts
repositories/
  <nome>-repository.ts             -> INTERFACE do contrato
  prisma/prisma-<nome>-repository.ts    -> implementação Prisma
  in-memory/in-memory-<nome>-repository.ts -> implementação p/ testes unitários
middlewares/       -> verify-auth.ts (autenticação via BetterAuth)
env/index.ts       -> valida process.env com Zod (safeParse); único lugar que lê process.env
lib/               -> prisma.ts (client único), auth.ts (BetterAuth), ai-model.ts
schemas/index.ts   -> ErrorSchema compartilhado (respostas de erro)
app.ts             -> monta o app Fastify (plugins, rotas, setErrorHandler central)
server.ts          -> apenas app.listen
test/use-cases/    -> testes unitários
test/e2e/          -> testes e2e (supertest + Prisma isolado por schema)
```

## Fastify: Controllers e Rotas

- **SEMPRE** siga os princípios do REST para criar rotas. Exemplo: `GET /workout-plans`, `GET /workout-plans/:id/days`.
- **SEMPRE** crie um arquivo por ação em `src/controllers/<recurso>/<acao>.ts` e registre as rotas em `src/controllers/<recurso>/routes.ts` usando `app.withTypeProvider<ZodTypeProvider>().route({...})`.
- **SEMPRE** use `fastify-type-provider-zod` para definir os schemas de request e response de uma rota, com `operationId`, `tags` e `summary` para o Swagger/OpenAPI.
- **SEMPRE** use Zod v4, **NUNCA** use o Zod v3.
- **SEMPRE** crie os schemas do recurso em `src/controllers/<recurso>/schemas.ts` e exporte os tipos inferidos (ex.: `export type CreateWorkoutPlanBody = z.infer<typeof CreateWorkoutPlanBodySchema>`).
- **SEMPRE** use `z.enum(WeekDay)` importado de `@/generated/prisma/enums` para tipar campos de dia da semana nos schemas. **NUNCA** use `z.string()` para representar WeekDay.
- **SEMPRE** use o `ErrorSchema` de `@/schemas` para tipar respostas de erro (formato `{ error, code }`).
- Um controller **NUNCA** deve conter regra de negócio nem acesso a banco. Ele só extrai dados do request, chama a factory do use case e responde.
- Quando uma rota precisar ser protegida, **SEMPRE** use `onRequest: [verifyAuth]` (`@/middlewares/verify-auth`). O middleware popula `request.user`.
- **SEMPRE** trate os erros de domínio no controller com `try/catch`, mapeando cada erro para o status HTTP adequado (`NotFoundError` -> 404, `WorkoutPlanNotActiveError` -> 400, `SessionAlreadyStartedError` -> 409). Qualquer outro erro deve ser **re-lançado** (`throw error`) para o `setErrorHandler` central de `app.ts`.

### Exemplo de controller (`src/controllers/workout-plans/get-workout-plan.ts`):

```ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GetWorkoutPlanParams } from '@/controllers/workout-plans/schemas';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { makeGetWorkoutPlanUseCase } from '@/use-cases/factories/make-get-workout-plan-use-case';

export const getWorkoutPlan = async (
	request: FastifyRequest<{ Params: GetWorkoutPlanParams }>,
	reply: FastifyReply,
) => {
	try {
		const getWorkoutPlanUseCase = makeGetWorkoutPlanUseCase();

		const result = await getWorkoutPlanUseCase.execute({
			userId: request.user.id,
			workoutPlanId: request.params.id,
		});

		return reply.status(200).send(result);
	} catch (error) {
		if (error instanceof NotFoundError) {
			return reply.status(404).send({ error: error.message, code: 'NOT_FOUND_ERROR' });
		}

		throw error;
	}
};
```

## Tratamento de erros (setErrorHandler central em app.ts)

- Erros de validação de request (Zod) -> 400 `{ error, code: 'VALIDATION_ERROR' }`.
- Erro de serialização de response (bug nosso) -> 500 (logado).
- Erro com `statusCode < 500` -> respeita o status.
- Fallback -> 500 `{ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' }`.
- O formato de resposta de erro é **SEMPRE** `{ error: string, code: string }` (ErrorSchema) — não mudar sem alinhar com o front.

## Use Cases

- Toda regra de negócio vive em um use case (`src/use-cases/<nome>.ts`).
- Todos os use cases são classes nomeadas com verbo e sufixo `UseCase` (ex.: `CreateWorkoutPlanUseCase`), com um único método `execute`.
- **SEMPRE** receba as dependências (interfaces de repositório) via constructor. Um use case **NUNCA** importa uma implementação Prisma nem o client do Prisma diretamente.
- O parâmetro do `execute` é **SEMPRE** uma interface `<Nome>UseCaseRequest` e o retorno é **SEMPRE** tipado com `<Nome>UseCaseResponse`, ambas definidas no mesmo arquivo. O use case mapeia o resultado do repositório para o Response, **NUNCA** retornando o model do Prisma diretamente.
- **NUNCA** lide com erros (try/catch) nos use cases. Quem trata erros é o controller.
- Caso um use case lance uma exceção, deve ser **SEMPRE** um erro de domínio de `src/use-cases/errors/` (um arquivo por erro, classe que estende `Error`). Caso o erro necessário não exista, crie-o.

### Exemplo:

```ts
import type { WorkoutPlansRepository } from '@/repositories/workout-plans-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';

interface GetWorkoutPlanUseCaseRequest {
	userId: string;
	workoutPlanId: string;
}

interface GetWorkoutPlanUseCaseResponse {
	id: string;
	name: string;
}

export class GetWorkoutPlanUseCase {
	constructor(private workoutPlansRepository: WorkoutPlansRepository) {}

	async execute(request: GetWorkoutPlanUseCaseRequest): Promise<GetWorkoutPlanUseCaseResponse> {
		const workoutPlan = await this.workoutPlansRepository.findByIdAndUserId({
			workoutPlanId: request.workoutPlanId,
			userId: request.userId,
		});

		if (!workoutPlan) {
			throw new NotFoundError('Workout plan not found');
		}

		return { id: workoutPlan.id, name: workoutPlan.name };
	}
}
```

## Repositórios

- O contrato é uma interface em `src/repositories/<nome>-repository.ts`, usando tipos do Prisma (ex.: `Prisma.WorkoutPlanGetPayload<...>`, `WorkoutPlan`).
- A implementação Prisma vive em `src/repositories/prisma/prisma-<nome>-repository.ts` (`implements <Nome>Repository`) e é o único lugar (além de `lib/prisma.ts` e BetterAuth) que toca o Prisma Client.
- A implementação in-memory vive em `src/repositories/in-memory/in-memory-<nome>-repository.ts` e expõe `public items` para os testes unitários manipularem o estado.
- Invariantes que exigem atomicidade (ex.: "um usuário tem no máximo um plano ativo") são garantidas dentro do método do repositório com `prisma.$transaction`, e a implementação in-memory deve reproduzir o mesmo comportamento.

## Factories

- `src/use-cases/factories/make-<nome>-use-case.ts` instancia os repositórios Prisma concretos e injeta no use case. É o **único** ponto que conhece as implementações concretas.
- Controllers **SEMPRE** obtêm use cases via factory, **NUNCA** com `new <Nome>UseCase(...)` direto.

## Env

- **SEMPRE** valide variáveis de ambiente em `src/env/index.ts` (Zod `safeParse`, lança erro se inválido) e importe `env` de `@/env`.
- **NUNCA** acesse `process.env` fora de `src/env` (exceção: setup de testes e2e).

## Testes (Vitest)

- Unitários em `src/test/use-cases/<nome>.test.ts`: instancie o repositório in-memory e o use case no `beforeEach` (padrão SUT: `let sut`), testando as regras de negócio isoladamente. Rode com `pnpm test`.
- E2E em `src/test/e2e/controllers/<recurso>/<acao>.test.ts`: supertest contra `app.server`, com `app.ready()` no `beforeAll` e `app.close()` no `afterAll`. Cada arquivo roda em um schema isolado do Postgres (ver `src/test/e2e/setup-e2e.ts`). Use os helpers `createAndAuthenticateUser` e `createTestWorkoutPlan`. Rode com `pnpm test:e2e` (requer `DATABASE_URL` acessível).
