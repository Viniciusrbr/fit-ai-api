import 'dotenv/config';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import { fromNodeHeaders } from 'better-auth/node';
import Fastify from 'fastify';
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { auth } from './lib/auth';
import { env } from './lib/env';
import { aiRoutes } from './routes/ai';
import { homeRoutes } from './routes/home';
import { meRoutes } from './routes/me';
import { statsRoutes } from './routes/stats';
import { workoutPlanRoutes } from './routes/workout-plan';

const app = Fastify({
	logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

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
await app.register(workoutPlanRoutes, { prefix: '/workout-plans' });
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
	origin: ['http://localhost:3000', 'http://localhost:8081'],
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

try {
	await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (err) {
	app.log.error(err);
	process.exit(1);
}
