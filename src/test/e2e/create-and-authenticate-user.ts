import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';

interface AuthenticatedUser {
	userId: string;
	cookies: string[];
}

// Cria um usuário via BetterAuth (email/senha) e retorna os cookies de sessão
export const createAndAuthenticateUser = async (
	app: FastifyInstance,
): Promise<AuthenticatedUser> => {
	const response = await request(app.server)
		.post('/api/auth/sign-up/email')
		.send({
			name: 'John Doe',
			email: `${randomUUID()}@example.com`,
			password: 'password123',
		});

	if (response.status !== 200) {
		throw new Error(`Failed to sign up test user: ${response.status} ${response.text}`);
	}

	return {
		userId: response.body.user.id,
		cookies: response.get('Set-Cookie') ?? [],
	};
};
