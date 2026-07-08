import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { auth } from '@/lib/auth';

// Garante que a rota só é acessada por usuários autenticados e popula request.user
export const verifyAuth = async (request: FastifyRequest, reply: FastifyReply) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(request.headers),
	});

	if (!session) {
		return reply.status(401).send({
			error: 'Unauthorized',
			code: 'UNAUTHORIZED',
		});
	}

	request.user = {
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
	};
};
