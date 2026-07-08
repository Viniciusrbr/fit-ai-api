import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { createTestWorkoutPlan } from '@/test/e2e/create-test-workout-plan';

describe('Get Workout Day (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server).get(
			`/workout-plans/${randomUUID()}/days/${randomUUID()}`,
		);

		expect(response.status).toBe(401);
	});

	it('should return 404 when the day does not exist', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId } = await createTestWorkoutPlan(app, cookies);

		const response = await request(app.server)
			.get(`/workout-plans/${workoutPlanId}/days/${randomUUID()}`)
			.set('Cookie', cookies);

		expect(response.status).toBe(404);
	});

	it('should return the day with its exercises and sessions', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		await request(app.server)
			.post(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions`)
			.set('Cookie', cookies);

		const response = await request(app.server)
			.get(`/workout-plans/${workoutPlanId}/days/${workoutDayId}`)
			.set('Cookie', cookies);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(workoutDayId);
		expect(response.body.exercises).toHaveLength(1);
		expect(response.body.sessions).toHaveLength(1);
		expect(response.body.sessions[0].startedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
