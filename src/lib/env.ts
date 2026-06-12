import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().default(8080),
	API_BASE_URL: z.url().default('http://localhost:8080'),
});

export const env = envSchema.parse(process.env);
