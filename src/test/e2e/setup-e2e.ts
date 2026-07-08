import 'dotenv/config';

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { afterAll } from 'vitest';

// Cada arquivo de teste e2e roda em um schema isolado do Postgres,
// criado aqui e destruído no afterAll
const schema = `test_${randomUUID().replaceAll('-', '')}`;

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is required to run e2e tests.');
}

const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set('schema', schema);

process.env.DATABASE_URL = databaseUrl.toString();
process.env.NODE_ENV = 'test';

execSync('pnpm prisma db push', {
	env: { ...process.env },
	stdio: 'ignore',
});

afterAll(async () => {
	const { prisma } = await import('@/lib/prisma');
	await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
	await prisma.$disconnect();
});
