import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { createTestWorkoutPlan } from '@/test/e2e/create-test-workout-plan';

describe('Update Workout Session (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server)
			.patch(`/workout-plans/${randomUUID()}/days/${randomUUID()}/sessions/${randomUUID()}`)
			.send({ completedAt: new Date().toISOString() });

		expect(response.status).toBe(401);
	});

	it('should complete a workout session', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		const startResponse = await request(app.server)
			.post(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions`)
			.set('Cookie', cookies);
		const workoutSessionId = startResponse.body.userWorkoutSessionId;

		const completedAt = new Date().toISOString();
		const response = await request(app.server)
			.patch(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions/${workoutSessionId}`)
			.set('Cookie', cookies)
			.send({ completedAt });

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(workoutSessionId);
		expect(response.body.completedAt).toBe(completedAt);
	});

	it('should return 404 when the session does not exist', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		const response = await request(app.server)
			.patch(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions/${randomUUID()}`)
			.set('Cookie', cookies)
			.send({ completedAt: new Date().toISOString() });

		expect(response.status).toBe(404);
		expect(response.body.code).toBe('NOT_FOUND_ERROR');
	});
});
