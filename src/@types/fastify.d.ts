import 'fastify';

declare module 'fastify' {
	interface FastifyRequest {
		// Preenchido pelo middleware verify-auth em rotas protegidas
		user: {
			id: string;
			name: string;
			email: string;
		};
	}
}
