import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, 'src'),
		},
	},
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/test/use-cases/**/*.test.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'e2e',
					environment: 'node',
					include: ['src/test/e2e/**/*.test.ts'],
					setupFiles: ['src/test/e2e/setup-e2e.ts'],
					// Arquivos e2e rodam em série: cada um cria/derruba seu schema no Postgres
					fileParallelism: false,
					hookTimeout: 60_000,
					testTimeout: 30_000,
				},
			},
		],
	},
});
