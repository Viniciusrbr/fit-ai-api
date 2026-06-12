import 'dotenv/config';
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import Fastify from 'fastify';
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import z from 'zod';
import { env } from './lib/env';

const app = Fastify({
	logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

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

app.withTypeProvider<ZodTypeProvider>().route({
	method: 'GET',
	url: '/',
	schema: {
		description: 'Hello world',
		tags: ['Hello World'],
		response: {
			200: z.object({
				message: z.string(),
			}),
		},
	},
	handler: () => {
		return {
			message: 'Hello World',
		};
	},
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

try {
	await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (err) {
	app.log.error(err);
	process.exit(1);
}
