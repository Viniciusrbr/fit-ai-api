import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { buildWorkoutPlanBody } from '@/test/e2e/create-test-workout-plan';

describe('List Workout Plans (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server).get('/workout-plans');

		expect(response.status).toBe(401);
	});

	it('should list only the plans of the authenticated user', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { cookies: otherUserCookies } = await createAndAuthenticateUser(app);

		await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send(buildWorkoutPlanBody());
		await request(app.server)
			.post('/workout-plans')
			.set('Cookie', otherUserCookies)
			.send({ ...buildWorkoutPlanBody(), name: 'Plano de outro usuário' });

		const response = await request(app.server).get('/workout-plans').set('Cookie', cookies);

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(1);
		expect(response.body[0].name).toBe('Plano de Teste');
	});

	it('should filter plans by active status', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send(buildWorkoutPlanBody());
		await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send({ ...buildWorkoutPlanBody(), name: 'Plano Ativo' });

		const response = await request(app.server)
			.get('/workout-plans')
			.set('Cookie', cookies)
			.query({ active: 'false' });

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(1);
		expect(response.body[0].name).toBe('Plano de Teste');
	});
});
