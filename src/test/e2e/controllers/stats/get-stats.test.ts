import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { createTestWorkoutPlan } from '@/test/e2e/create-test-workout-plan';

describe('Get Stats (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server)
			.get('/stats')
			.query({ from: '2026-01-01', to: '2026-01-31' });

		expect(response.status).toBe(401);
	});

	it('should return 400 when the period is missing', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server).get('/stats').set('Cookie', cookies);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe('VALIDATION_ERROR');
	});

	it('should compute stats from the user sessions', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		const startResponse = await request(app.server)
			.post(`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions`)
			.set('Cookie', cookies);
		await request(app.server)
			.patch(
				`/workout-plans/${workoutPlanId}/days/${workoutDayId}/sessions/${startResponse.body.userWorkoutSessionId}`,
			)
			.set('Cookie', cookies)
			.send({ completedAt: new Date().toISOString() });

		const today = new Date().toISOString().slice(0, 10);
		const response = await request(app.server)
			.get('/stats')
			.set('Cookie', cookies)
			.query({ from: today, to: today });

		expect(response.status).toBe(200);
		expect(response.body.completedWorkoutsCount).toBe(1);
		expect(response.body.conclusionRate).toBe(1);
		expect(response.body.workoutStreak).toBe(1);
	});
});
