import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { auth } from '@/lib/auth';
import { ErrorSchema, HomeParamsSchema, HomeResponseSchema } from '@/schemas';
import { GetHomeData } from '@/useCases/get-home-data';

export const homeRoutes = async (app: FastifyInstance) => {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: 'GET',
		url: '/:date',
		schema: {
			operationId: 'getHomeData',
			tags: ['Home'],
			summary: 'Get home data for the authenticated user',
			params: HomeParamsSchema,
			response: {
				200: HomeResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
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
				const getHomeData = new GetHomeData();
				const result = await getHomeData.execute({
					userId: session.user.id,
					date: request.params.date,
				});
				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);
				return reply.status(500).send({
					error: 'Internal server error',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
		},
	});
};
