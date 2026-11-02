import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { createWorkoutPlan } from '@/controllers/workout-plans/create-workout-plan';
import { getWorkoutDay } from '@/controllers/workout-plans/get-workout-day';
import { getWorkoutPlan } from '@/controllers/workout-plans/get-workout-plan';
import { listWorkoutPlans } from '@/controllers/workout-plans/list-workout-plans';
import {
	CreateWorkoutPlanBodySchema,
	GetWorkoutDayParamsSchema,
	GetWorkoutDayResponseSchema,
	GetWorkoutPlanParamsSchema,
	GetWorkoutPlanResponseSchema,
	ListWorkoutPlansQuerySchema,
	ListWorkoutPlansResponseSchema,
	StartWorkoutSessionParamsSchema,
	StartWorkoutSessionResponseSchema,
	UpdateWorkoutSessionBodySchema,
	UpdateWorkoutSessionParamsSchema,
	UpdateWorkoutSessionResponseSchema,
	WorkoutPlanSchema,
} from '@/controllers/workout-plans/schemas';
import { startWorkoutSession } from '@/controllers/workout-plans/start-workout-session';
import { updateWorkoutSession } from '@/controllers/workout-plans/update-workout-session';
import { verifyAuth } from '@/middlewares/verify-auth';
import {
	errorResponse,
	InternalErrorSchema,
	sessionAuth,
	UnauthorizedErrorSchema,
	ValidationErrorSchema,
} from '@/schemas';

const WorkoutPlanNotFoundErrorSchema = errorResponse({
	description: 'Plano não encontrado ou de outro usuário (`NOT_FOUND_ERROR`).',
	example: { error: 'Workout plan not found', code: 'NOT_FOUND_ERROR' },
});

export const workoutPlansRoutes = async (app: FastifyInstance) => {
	const router = app.withTypeProvider<ZodTypeProvider>();

	router.route({
		method: 'GET',
		url: '/',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'listWorkoutPlans',
			tags: ['Workout Plan'],
			summary: 'List workout plans, optionally filtered by active status',
			description: 'Lista os planos do usuário autenticado, do mais recente para o mais antigo.',
			security: sessionAuth,
			querystring: ListWorkoutPlansQuerySchema,
			response: {
				200: ListWorkoutPlansResponseSchema,
				400: ValidationErrorSchema,
				401: UnauthorizedErrorSchema,
				500: InternalErrorSchema,
			},
		},
		handler: listWorkoutPlans,
	});

	router.route({
		method: 'GET',
		url: '/:id',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'getWorkoutPlan',
			tags: ['Workout Plan'],
			summary: 'Get a workout plan by id',
			description:
				'Retorna o plano com um resumo de cada dia (`exercisesCount`, sem a lista de exercícios). Para ver os exercícios de um dia, use `GET /workout-plans/{workoutPlanId}/days/{workoutDayId}`.',
			security: sessionAuth,
			params: GetWorkoutPlanParamsSchema,
			response: {
				200: GetWorkoutPlanResponseSchema,
				400: ValidationErrorSchema,
				401: UnauthorizedErrorSchema,
				404: WorkoutPlanNotFoundErrorSchema,
				500: InternalErrorSchema,
			},
		},
		handler: getWorkoutPlan,
	});

	router.route({
		method: 'GET',
		url: '/:workoutPlanId/days/:workoutDayId',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'getWorkoutDay',
			tags: ['Workout Plan'],
			summary: 'Get a workout day with its exercises and sessions',
			security: sessionAuth,
			params: GetWorkoutDayParamsSchema,
			response: {
				200: GetWorkoutDayResponseSchema,
				400: ValidationErrorSchema,
				401: UnauthorizedErrorSchema,
				404: errorResponse({
					description:
						'Plano não encontrado, de outro usuário, ou o dia não pertence ao plano (`NOT_FOUND_ERROR`).',
					example: { error: 'Workout day not found', code: 'NOT_FOUND_ERROR' },
				}),
				500: InternalErrorSchema,
			},
		},
		handler: getWorkoutDay,
	});

	router.route({
		method: 'POST',
		url: '/',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'createWorkoutPlan',
			tags: ['Workout Plan'],
			summary: 'Create a new workout plan',
			description: [
				'**Regras**',
				'',
				'- O novo plano passa a ser o **plano ativo** do usuário. O plano ativo anterior é desativado na mesma transação.',
				'- `estimatedDurationInSeconds` é calculado pela API e não deve ser enviado.',
			].join('\n'),
			security: sessionAuth,
			body: CreateWorkoutPlanBodySchema,
			response: {
				201: WorkoutPlanSchema.meta({ description: 'Plano criado (e agora ativo)' }),
				400: ValidationErrorSchema,
				401: UnauthorizedErrorSchema,
				500: InternalErrorSchema,
			},
		},
		handler: createWorkoutPlan,
	});

	router.route({
		method: 'POST',
		url: '/:workoutPlanId/days/:workoutDayId/sessions',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'startWorkoutSession',
			tags: ['Workout Plan'],
			summary: 'Start a workout session for a workout day',
			description: [
				'Registra o início do treino do dia. Para concluir, envie o `userWorkoutSessionId` retornado no `PATCH .../sessions/{workoutSessionId}`.',
				'',
				'**Regras**',
				'',
				'- Só é possível iniciar sessões no **plano ativo**.',
				'- Cada dia pode ter **uma sessão em aberto** por vez.',
			].join('\n'),
			security: sessionAuth,
			params: StartWorkoutSessionParamsSchema,
			response: {
				201: StartWorkoutSessionResponseSchema,
				400: errorResponse({
					description:
						'O plano não está ativo (`WORKOUT_PLAN_NOT_ACTIVE_ERROR`) ou os parâmetros são inválidos (`VALIDATION_ERROR`).',
					example: { error: 'Workout plan is not active', code: 'WORKOUT_PLAN_NOT_ACTIVE_ERROR' },
				}),
				401: UnauthorizedErrorSchema,
				404: errorResponse({
					description:
						'Plano não encontrado, de outro usuário, ou o dia não pertence ao plano (`NOT_FOUND_ERROR`).',
					example: { error: 'Workout plan not found', code: 'NOT_FOUND_ERROR' },
				}),
				409: errorResponse({
					description:
						'Já existe uma sessão em aberto para este dia (`SESSION_ALREADY_STARTED_ERROR`). Conclua a sessão atual antes de iniciar outra.',
					example: {
						error: 'Workout session already started',
						code: 'SESSION_ALREADY_STARTED_ERROR',
					},
				}),
				500: InternalErrorSchema,
			},
		},
		handler: startWorkoutSession,
	});

	router.route({
		method: 'PATCH',
		url: '/:workoutPlanId/days/:workoutDayId/sessions/:workoutSessionId',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'updateWorkoutSession',
			tags: ['Workout Plan'],
			summary: 'Update a workout session',
			description: 'Conclui a sessão de treino registrando o horário de término (`completedAt`).',
			security: sessionAuth,
			params: UpdateWorkoutSessionParamsSchema,
			body: UpdateWorkoutSessionBodySchema,
			response: {
				200: UpdateWorkoutSessionResponseSchema,
				400: ValidationErrorSchema,
				401: UnauthorizedErrorSchema,
				404: errorResponse({
					description: 'Sessão não encontrada para este usuário, plano e dia (`NOT_FOUND_ERROR`).',
					example: { error: 'Workout session not found', code: 'NOT_FOUND_ERROR' },
				}),
				500: InternalErrorSchema,
			},
		},
		handler: updateWorkoutSession,
	});
};
