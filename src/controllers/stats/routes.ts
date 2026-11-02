import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { getStats } from '@/controllers/stats/get-stats';
import { GetStatsQuerySchema, GetStatsResponseSchema } from '@/controllers/stats/schemas';
import { verifyAuth } from '@/middlewares/verify-auth';
import {
	InternalErrorSchema,
	sessionAuth,
	UnauthorizedErrorSchema,
	ValidationErrorSchema,
} from '@/schemas';

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
			security: sessionAuth,
			querystring: GetStatsQuerySchema,
			response: {
				200: GetStatsResponseSchema,
				400: ValidationErrorSchema,
				401: UnauthorizedErrorSchema,
				500: InternalErrorSchema,
			},
		},
		handler: getStats,
	});
};
