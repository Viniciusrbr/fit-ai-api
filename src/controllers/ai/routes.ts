import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { chat } from '@/controllers/ai/chat';
import { AiChatBodySchema } from '@/controllers/ai/schemas';
import { verifyAuth } from '@/middlewares/verify-auth';
import { InternalErrorSchema, sessionAuth, UnauthorizedErrorSchema } from '@/schemas';

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
			// a resposta de sucesso é um stream, por isso não tem schema Zod de 200
			description: [
				'Conversa com o personal trainer virtual (Llama 3.3 70B via Groq, com fallback para OpenRouter).',
				'',
				'A resposta de sucesso é um **stream** no protocolo de UI messages do Vercel AI SDK, pronto para o `useChat`. Durante a conversa, o agente pode salvar os dados físicos do usuário e criar planos de treino.',
			].join('\n'),
			security: sessionAuth,
			body: AiChatBodySchema,
			response: {
				401: UnauthorizedErrorSchema,
				500: InternalErrorSchema,
			},
		},
		handler: chat,
	});
};
