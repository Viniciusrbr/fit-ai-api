import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { getUserTrainData } from '@/controllers/me/get-user-train-data';
import { GetUserTrainDataResponseSchema } from '@/controllers/me/schemas';
import { verifyAuth } from '@/middlewares/verify-auth';
import { ErrorSchema } from '@/schemas';

export const meRoutes = async (app: FastifyInstance) => {
	const router = app.withTypeProvider<ZodTypeProvider>();

	router.route({
		method: 'GET',
		url: '/',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'getUserTrainData',
			tags: ['User'],
			summary: 'Get train data for the authenticated user',
			response: {
				200: GetUserTrainDataResponseSchema,
				401: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: getUserTrainData,
	});
};
