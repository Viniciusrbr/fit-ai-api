import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { NotFoundError, SessionAlreadyStartedError, WorkoutPlanNotActiveError } from '@/errors';
import { auth } from '@/lib/auth';
import {
	ErrorSchema,
	GetWorkoutDayParamsSchema,
	GetWorkoutDayResponseSchema,
	GetWorkoutPlanParamsSchema,
	GetWorkoutPlanResponseSchema,
	StartWorkoutSessionParamsSchema,
	StartWorkoutSessionResponseSchema,
	UpdateWorkoutSessionBodySchema,
	UpdateWorkoutSessionParamsSchema,
	UpdateWorkoutSessionResponseSchema,
	WorkoutPlanSchema,
} from '@/schemas';
import { CreateWorkoutPlan } from '@/useCases/create-workout-plan';
import { GetWorkoutDay } from '@/useCases/get-workout-day';
import { GetWorkoutPlan } from '@/useCases/get-workout-plan';
import { StartWorkoutSession } from '@/useCases/start-workout-session';
import { UpdateWorkoutSession } from '@/useCases/update-workout-session';

export const workoutPlanRoutes = async (app: FastifyInstance) => {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/:id',
		schema: {
			tags: ['Workout Plan'],
			summary: 'Get a workout plan by id',
			params: GetWorkoutPlanParamsSchema,
			response: {
				200: GetWorkoutPlanResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});
				if (!session) {
					return reply.status(401).send({
						error: 'Unauthorized',
						code: 'UNAUTHORIZED',
					});
				}
				const getWorkoutPlan = new GetWorkoutPlan();
				const result = await getWorkoutPlan.execute({
					userId: session.user.id,
					workoutPlanId: request.params.id,
				});
				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);
				if (error instanceof NotFoundError) {
					return reply.status(404).send({
						error: error.message,
						code: 'NOT_FOUND_ERROR',
					});
				}
				return reply.status(500).send({
					error: 'Internal server error',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/:workoutPlanId/days/:workoutDayId',
		schema: {
			tags: ['Workout Plan'],
			summary: 'Get a workout day with its exercises and sessions',
			params: GetWorkoutDayParamsSchema,
			response: {
				200: GetWorkoutDayResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});
				if (!session) {
					return reply.status(401).send({
						error: 'Unauthorized',
						code: 'UNAUTHORIZED',
					});
				}
				const getWorkoutDay = new GetWorkoutDay();
				const result = await getWorkoutDay.execute({
					userId: session.user.id,
					workoutPlanId: request.params.workoutPlanId,
					workoutDayId: request.params.workoutDayId,
				});
				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);
				if (error instanceof NotFoundError) {
					return reply.status(404).send({
						error: error.message,
						code: 'NOT_FOUND_ERROR',
					});
				}
				return reply.status(500).send({
					error: 'Internal server error',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/',
		schema: {
			tags: ['Workout Plan'],
			summary: 'Create a new workout plan',
			body: WorkoutPlanSchema.omit({ id: true }),
			response: {
				201: WorkoutPlanSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});
				if (!session) {
					return reply.status(401).send({
						error: 'Unauthorized',
						code: 'UNAUTHORIZED',
					});
				}
				const createWorkoutPlan = new CreateWorkoutPlan();
				const result = await createWorkoutPlan.execute({
					userId: session.user.id,
					name: request.body.name,
					workoutDays: request.body.workoutDays,
				});
				return reply.status(201).send(result);
			} catch (error) {
				app.log.error(error);
				if (error instanceof NotFoundError) {
					return reply.status(404).send({
						error: error.message,
						code: 'NOT_FOUND_ERROR',
					});
				}
				return reply.status(500).send({
					error: 'Internal server error',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'POST',
		url: '/:workoutPlanId/days/:workoutDayId/sessions',
		schema: {
			tags: ['Workout Plan'],
			summary: 'Start a workout session for a workout day',
			params: StartWorkoutSessionParamsSchema,
			response: {
				201: StartWorkoutSessionResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				409: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});
				if (!session) {
					return reply.status(401).send({
						error: 'Unauthorized',
						code: 'UNAUTHORIZED',
					});
				}
				const startWorkoutSession = new StartWorkoutSession();
				const result = await startWorkoutSession.execute({
					userId: session.user.id,
					workoutPlanId: request.params.workoutPlanId,
					workoutDayId: request.params.workoutDayId,
				});
				return reply.status(201).send(result);
			} catch (error) {
				app.log.error(error);
				if (error instanceof NotFoundError) {
					return reply.status(404).send({
						error: error.message,
						code: 'NOT_FOUND_ERROR',
					});
				}
				if (error instanceof WorkoutPlanNotActiveError) {
					return reply.status(400).send({
						error: error.message,
						code: 'WORKOUT_PLAN_NOT_ACTIVE_ERROR',
					});
				}
				if (error instanceof SessionAlreadyStartedError) {
					return reply.status(409).send({
						error: error.message,
						code: 'SESSION_ALREADY_STARTED_ERROR',
					});
				}
				return reply.status(500).send({
					error: 'Internal server error',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'PATCH',
		url: '/:workoutPlanId/days/:workoutDayId/sessions/:workoutSessionId',
		schema: {
			tags: ['Workout Plan'],
			summary: 'Update a workout session',
			params: UpdateWorkoutSessionParamsSchema,
			body: UpdateWorkoutSessionBodySchema,
			response: {
				200: UpdateWorkoutSessionResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});
				if (!session) {
					return reply.status(401).send({
						error: 'Unauthorized',
						code: 'UNAUTHORIZED',
					});
				}
				const updateWorkoutSession = new UpdateWorkoutSession();
				const result = await updateWorkoutSession.execute({
					userId: session.user.id,
					workoutPlanId: request.params.workoutPlanId,
					workoutDayId: request.params.workoutDayId,
					workoutSessionId: request.params.workoutSessionId,
					completedAt: request.body.completedAt,
				});
				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);
				if (error instanceof NotFoundError) {
					return reply.status(404).send({
						error: error.message,
						code: 'NOT_FOUND_ERROR',
					});
				}
				return reply.status(500).send({
					error: 'Internal server error',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
		},
	});
};
