import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';
import { prisma } from './db';

export const auth = betterAuth({
	trustedOrigins: ['http://localhost:3000', 'http://localhost:8081'],
	emailAndPassword: {
		enabled: true,
	},
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	plugins: [openAPI()],
});
