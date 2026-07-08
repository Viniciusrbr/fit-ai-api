import { app } from '@/app';
import { env } from '@/env';

try {
	await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (err) {
	app.log.error(err);
	process.exit(1);
}
