import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';
import { createTestWorkoutPlan } from '@/test/e2e/create-test-workout-plan';

describe('Get Home Data (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server).get('/home/2026-01-07');

		expect(response.status).toBe(401);
	});

	it('should return 400 for an invalid date', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server).get('/home/not-a-date').set('Cookie', cookies);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe('VALIDATION_ERROR');
	});

	it('should return an empty state when the user has no active plan', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server).get('/home/2026-01-07').set('Cookie', cookies);

		expect(response.status).toBe(200);
		expect(response.body.activeWorkoutPlanId).toBeNull();
		expect(response.body.workoutStreak).toBe(0);
		expect(Object.keys(response.body.consistencyByDay)).toHaveLength(7);
	});

	it('should return the active plan and the workout day of the date', async () => {
		const { cookies } = await createAndAuthenticateUser(app);
		const { workoutPlanId, workoutDayId } = await createTestWorkoutPlan(app, cookies);

		// 2026-01-05 é uma segunda-feira (MONDAY), mesmo weekDay do plano de teste
		const response = await request(app.server).get('/home/2026-01-05').set('Cookie', cookies);

		expect(response.status).toBe(200);
		expect(response.body.activeWorkoutPlanId).toBe(workoutPlanId);
		expect(response.body.todayWorkoutDay).toEqual(
			expect.objectContaining({ id: workoutDayId, exercisesCount: 1 }),
		);
	});
});
