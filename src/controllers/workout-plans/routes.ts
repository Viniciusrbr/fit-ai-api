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
import { ErrorSchema } from '@/schemas';

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
			querystring: ListWorkoutPlansQuerySchema,
			response: {
				200: ListWorkoutPlansResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				500: ErrorSchema,
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
			params: GetWorkoutPlanParamsSchema,
			response: {
				200: GetWorkoutPlanResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
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
			params: GetWorkoutDayParamsSchema,
			response: {
				200: GetWorkoutDayResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
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
			body: CreateWorkoutPlanBodySchema,
			response: {
				201: WorkoutPlanSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
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
		handler: updateWorkoutSession,
	});
};
