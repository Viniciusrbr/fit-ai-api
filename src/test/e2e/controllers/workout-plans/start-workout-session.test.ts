import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { buildWorkoutPlanBody, createTestWorkoutPlan } from '@/test/e2e/create-test-workout-plan';

describe('Start Workout Session (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server).post(
			`/workout-plans/${randomUUID()}/days/${randomUUID()}/sessions`,
		);

		expect(response.status).toBe(401);
	});

	it('should start a workout session', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		const response = await request(app.server)
			.post(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions`)
			.set('Cookie', cookies);

		expect(response.status).toBe(201);
		expect(response.body.userWorkoutSessionId).toEqual(expect.any(String));
	});

	it('should return 409 when there is already an open session for the day', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		await request(app.server)
			.post(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions`)
			.set('Cookie', cookies);
		const response = await request(app.server)
			.post(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions`)
			.set('Cookie', cookies);

		expect(response.status).toBe(409);
		expect(response.body.code).toBe('SESSION_ALREADY_STARTED_ERROR');
	});

	it('should return 400 when the plan is not active', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		// Criar um novo plano desativa o anterior
		await request(app.server)
			.post('/workout-plans')
			.set('Cookie', cookies)
			.send({ ...buildWorkoutPlanBody(), name: 'Plano Novo' });

		const response = await request(app.server)
			.post(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions`)
			.set('Cookie', cookies);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe('WORKOUT_PLAN_NOT_ACTIVE_ERROR');
	});
});
