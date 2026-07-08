import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { createTestWorkoutPlan } from '@/test/e2e/create-test-workout-plan';

describe('Get Workout Plan (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server).get(`/workout-plans/${randomUUID()}`);

		expect(response.status).toBe(401);
	});

	it('should return 404 when the plan does not exist', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server)
			.get(`/workout-plans/${randomUUID()}`)
			.set('Cookie', cookies);

		expect(response.status).toBe(404);
		expect(response.body.code).toBe('NOT_FOUND_ERROR');
	});

	it('should return the plan with the exercises count per day', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId } = await createTestWorkoutPlan(app, cookies);

		const response = await request(app.server)
			.get(`/workout-plans/${workoutPlanId}`)
			.set('Cookie', cookies);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(workoutPlanId);
		expect(response.body.workoutDays[0].exercisesCount).toBe(1);
	});

	it('should not expose plans of other users', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId } = await createTestWorkoutPlan(app, cookies);

		const { cookies: otherUserCookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server)
			.get(`/workout-plans/${workoutPlanId}`)
			.set('Cookie', otherUserCookies);

		expect(response.status).toBe(404);
	});
});
