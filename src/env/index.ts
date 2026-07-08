import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().default(8080),
	DATABASE_URL: z.string().startsWith('postgresql://'),
	BETTER_AUTH_SECRET: z.string(),
	API_BASE_URL: z.url().default('http://localhost:8080'),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
	GROQ_API_KEY: z.string(),
	OPENROUTER_API_KEY: z.string(),
	OPENAI_API_KEY: z.string().optional(),
	WEB_APP_BASE_URL: z.url(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error('❌ Invalid environment variables', z.treeifyError(parsedEnv.error));
	throw new Error('Invalid environment variables.');
}

export const env = parsedEnv.data;
