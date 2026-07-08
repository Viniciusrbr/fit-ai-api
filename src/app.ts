import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import { fromNodeHeaders } from 'better-auth/node';
import Fastify, { type FastifyError } from 'fastify';
import {
	hasZodFastifySchemaValidationErrors,
	isResponseSerializationError,
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { aiRoutes } from '@/controllers/ai/routes';
import { homeRoutes } from '@/controllers/home/routes';
import { meRoutes } from '@/controllers/me/routes';
import { statsRoutes } from '@/controllers/stats/routes';
import { workoutPlansRoutes } from '@/controllers/workout-plans/routes';
import { env } from '@/env';
import { auth } from '@/lib/auth';

const envToLogger = {
	development: {
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'HH:MM:ss Z',
				ignore: 'pid,hostname',
			},
		},
	},
	production: true,
	test: false,
};

export const app = Fastify({
	logger: envToLogger[env.NODE_ENV],
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Tratamento centralizado de erros: controllers tratam apenas erros de domínio
// e re-lançam o restante para cá
app.setErrorHandler((error: FastifyError, _request, reply) => {
	if (hasZodFastifySchemaValidationErrors(error)) {
		return reply.status(400).send({
			error: error.message,
			code: 'VALIDATION_ERROR',
		});
	}

	if (isResponseSerializationError(error)) {
		app.log.error(error);
		return reply.status(500).send({
			error: 'Internal server error',
			code: 'INTERNAL_SERVER_ERROR',
		});
	}

	if (error.statusCode && error.statusCode < 500) {
		return reply.status(error.statusCode).send({
			error: error.message,
			code: error.code ?? 'REQUEST_ERROR',
		});
	}

	app.log.error(error);
	return reply.status(500).send({
		error: 'Internal server error',
		code: 'INTERNAL_SERVER_ERROR',
	});
});

await app.register(fastifySwagger, {
	openapi: {
		info: {
			title: 'Fit.ai API',
			description: 'API documentation for Fit.ai',
			version: '1.0.0',
		},
		servers: [
			{
				description: 'API Base URL',
				url: env.API_BASE_URL,
			},
		],
	},
	transform: jsonSchemaTransform,
});

// Routes
await app.register(workoutPlansRoutes, { prefix: '/workout-plans' });
await app.register(homeRoutes, { prefix: '/home' });
await app.register(statsRoutes, { prefix: '/stats' });
await app.register(meRoutes, { prefix: '/me' });
await app.register(aiRoutes, { prefix: '/ai' });

app.withTypeProvider<ZodTypeProvider>().route({
	method: 'GET',
	url: '/swagger.json',
	schema: {
		hide: true,
	},
	handler: async () => {
		return app.swagger();
	},
});

await app.register(fastifyApiReference, {
	routePrefix: '/docs',
	configuration: {
		sources: [
			{
				title: 'Fit.ai Docs',
				slug: 'fit-ai-docs',
				url: '/swagger.json',
			},
			{
				title: 'Auth API',
				slug: 'auth-api',
				url: '/api/auth/open-api/generate-schema',
			},
		],
	},
});

await app.register(fastifyCors, {
	origin: [env.WEB_APP_BASE_URL],
	credentials: true,
});

// Register authentication endpoint
app.route({
	method: ['GET', 'POST'],
	url: '/api/auth/*',
	schema: {
		hide: true,
	},
	async handler(request, reply) {
		try {
			// Construct request URL
			const url = new URL(request.url, `http://${request.headers.host}`);

			// Convert Fastify headers to standard Headers object
			const headers = fromNodeHeaders(request.headers);
			// Create Fetch API-compatible request
			const req = new Request(url.toString(), {
				method: request.method,
				headers,
				...(request.body ? { body: JSON.stringify(request.body) } : {}),
			});
			// Process authentication request
			const response = await auth.handler(req);
			// Forward response to client
			reply.status(response.status);
			response.headers.forEach((value, key) => {
				reply.header(key, value);
			});
			return reply.send(response.body ? await response.text() : null);
		} catch (error) {
			app.log.error(error);
			return reply.status(500).send({
				error: 'Internal authentication error',
				code: 'AUTH_FAILURE',
			});
		}
	},
});
