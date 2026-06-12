import 'dotenv/config';
import Fastify from 'fastify';
import {
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

try {
	await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (err) {
	app.log.error(err);
	process.exit(1);
}
