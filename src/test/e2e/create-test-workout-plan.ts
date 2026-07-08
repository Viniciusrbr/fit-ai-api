import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { WeekDay } from '@/generated/prisma/enums';

export const buildWorkoutPlanBody = () => ({
	name: 'Plano de Teste',
	workoutDays: [
		{
			name: 'Peito e Tríceps',
			weekDay: WeekDay.MONDAY,
			isRest: false,
			estimatedDurationInSeconds: 3600,
			exercises: [{ order: 1, name: 'Supino reto', sets: 4, reps: 10, restTimeInSeconds: 90 }],
		},
	],
});

// Cria um plano via API e retorna os ids (a listagem expõe os ids dos dias)
export const createTestWorkoutPlan = async (app: FastifyInstance, cookies: string[]) => {
	const createResponse = await request(app.server)
		.post('/workout-plans')
		.set('Cookie', cookies)
		.send(buildWorkoutPlanBody());

	if (createResponse.status !== 201) {
		throw new Error(`Failed to create test workout plan: ${createResponse.text}`);
	}

	const listResponse = await request(app.server)
		.get('/workout-plans')
		.set('Cookie', cookies)
		.query({ active: 'true' });

	const [workoutPlan] = listResponse.body;

	return {
		workoutPlanId: workoutPlan.id as string,
		workoutDayId: workoutPlan.workoutDays[0].id as string,
	};
};
