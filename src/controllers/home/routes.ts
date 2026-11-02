import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { getHomeData } from '@/controllers/home/get-home-data';
import { HomeParamsSchema, HomeResponseSchema } from '@/controllers/home/schemas';
import { verifyAuth } from '@/middlewares/verify-auth';
import {
	InternalErrorSchema,
	sessionAuth,
	UnauthorizedErrorSchema,
	ValidationErrorSchema,
} from '@/schemas';

export const homeRoutes = async (app: FastifyInstance) => {
	const router = app.withTypeProvider<ZodTypeProvider>();

	router.route({
		method: 'GET',
		url: '/:date',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'getHomeData',
			tags: ['Home'],
			summary: 'Get home data for the authenticated user',
			security: sessionAuth,
			params: HomeParamsSchema,
			response: {
				200: HomeResponseSchema,
				400: ValidationErrorSchema,
				401: UnauthorizedErrorSchema,
				500: InternalErrorSchema,
			},
		},
		handler: getHomeData,
	});
};
