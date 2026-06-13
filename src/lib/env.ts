import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().default(8081),
	API_BASE_URL: z.url().default('http://localhost:8081'),
});

export const env = envSchema.parse(process.env);
