import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { buildWorkoutPlanBody } from '@/test/e2e/create-test-workout-plan';

describe('Create Workout Plan (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server).post('/workout-plans').send(buildWorkoutPlanBody());

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
	});

	it('should return 400 when the body is invalid', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send({ name: '' });

		expect(response.status).toBe(400);
		expect(response.body.code).toBe('VALIDATION_ERROR');
	});

	it('should create a workout plan', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send(buildWorkoutPlanBody());

		expect(response.status).toBe(201);
		expect(response.body).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				name: 'Plano de Teste',
			}),
		);
		expect(response.body.workoutDays).toHaveLength(1);
	});

	it('should deactivate the previous plan when creating a new one', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send(buildWorkoutPlanBody());
		await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send({ ...buildWorkoutPlanBody(), name: 'Plano Novo' });

		const listResponse = await request(app.server)
			.get('/workout-plans')
			.set('Cookie', cookies)
			.query({ active: 'true' });

		expect(listResponse.body).toHaveLength(1);
		expect(listResponse.body[0].name).toBe('Plano Novo');
	});
});
