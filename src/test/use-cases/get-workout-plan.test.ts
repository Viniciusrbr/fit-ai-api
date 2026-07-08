import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { GetWorkoutPlanUseCase } from '@/use-cases/get-workout-plan';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let sut: GetWorkoutPlanUseCase;

describe('Get Workout Plan Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		sut = new GetWorkoutPlanUseCase(workoutPlansRepository);
	});

	it('should return the plan with the exercises count per day', async () => {
		const workoutPlan = await workoutPlansRepository.create({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: [
				{
					name: 'Peito e Tríceps',
					weekDay: WeekDay.MONDAY,
					isRest: false,
					estimatedDurationInSeconds: 3600,
					exercises: [
						{ order: 1, name: 'Supino reto', sets: 4, reps: 10, restTimeInSeconds: 90 },
						{ order: 2, name: 'Crucifixo', sets: 3, reps: 12, restTimeInSeconds: 60 },
					],
				},
			],
		});

		const result = await sut.execute({ userId: 'user-1', workoutPlanId: workoutPlan.id });

		expect(result.id).toBe(workoutPlan.id);
		expect(result.workoutDays[0].exercisesCount).toBe(2);
	});

	it('should throw NotFoundError when the plan does not exist', async () => {
		await expect(
			sut.execute({ userId: 'user-1', workoutPlanId: 'non-existing-id' }),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it('should throw NotFoundError when the plan belongs to another user', async () => {
		const workoutPlan = await workoutPlansRepository.create({
			userId: 'user-2',
			name: 'Plano de outro usuário',
			workoutDays: [],
		});

		await expect(
			sut.execute({ userId: 'user-1', workoutPlanId: workoutPlan.id }),
		).rejects.toBeInstanceOf(NotFoundError);
	});
});
