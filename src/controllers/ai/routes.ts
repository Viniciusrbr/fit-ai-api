import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { chat } from '@/controllers/ai/chat';
import { AiChatBodySchema } from '@/controllers/ai/schemas';
import { verifyAuth } from '@/middlewares/verify-auth';
import { ErrorSchema } from '@/schemas';

export const aiRoutes = async (app: FastifyInstance) => {
	const router = app.withTypeProvider<ZodTypeProvider>();

	router.route({
		method: 'POST',
		url: '/',
		onRequest: [verifyAuth],
		schema: {
			operationId: 'chatWithAi',
			tags: ['AI'],
			summary: 'Chat with AI personal trainer',
			body: AiChatBodySchema,
			response: {
				401: ErrorSchema,
				500: ErrorSchema,
			},
		},
		handler: chat,
	});
};
