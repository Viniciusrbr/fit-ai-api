import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { getStats } from '@/controllers/stats/get-stats';
import { GetStatsQuerySchema, GetStatsResponseSchema } from '@/controllers/stats/schemas';
import { verifyAuth } from '@/middlewares/verify-auth';
import { ErrorSchema } from '@/schemas';

export const statsRoutes = async (app: FastifyInstance) => {
	const router = app.withTypeProvider<ZodTypeProvider>();

	router.route({
		method: 'GET',
		url: '/',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'getStats',
			tags: ['Stats'],
			summary: 'Get workout stats for the authenticated user within a period',
			querystring: GetStatsQuerySchema,
			response: {
				200: GetStatsResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: getStats,
	});
};
