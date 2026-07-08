import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '@/env';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = env.DATABASE_URL;

// Permite isolar os testes e2e por schema via `?schema=` na DATABASE_URL
const schema = new URL(connectionString).searchParams.get('schema') ?? undefined;

const adapter = new PrismaPg({ connectionString }, { schema });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
