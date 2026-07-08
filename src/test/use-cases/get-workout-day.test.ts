import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutDaysRepository } from '@/repositories/in-memory/in-memory-workout-days-repository';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { InMemoryWorkoutSessionsRepository } from '@/repositories/in-memory/in-memory-workout-sessions-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { GetWorkoutDayUseCase } from '@/use-cases/get-workout-day';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let workoutSessionsRepository: InMemoryWorkoutSessionsRepository;
let workoutDaysRepository: InMemoryWorkoutDaysRepository;
let sut: GetWorkoutDayUseCase;

const createWorkoutPlan = async (userId: string) => {
	const workoutPlan = await workoutPlansRepository.create({
		userId,
		name: 'Plano A',
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

	return { workoutPlanId: workoutPlan.id, workoutDayId: workoutPlan.workoutDays[0].id };
};

describe('Get Workout Day Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		workoutSessionsRepository = new InMemoryWorkoutSessionsRepository(workoutPlansRepository);
		workoutDaysRepository = new InMemoryWorkoutDaysRepository(
			workoutPlansRepository,
			workoutSessionsRepository,
		);
		sut = new GetWorkoutDayUseCase(workoutDaysRepository);
	});

	it('should return the day with exercises and sessions formatted as date keys', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-1');

		workoutSessionsRepository.items.push({
			id: 'session-1',
			workoutDayId,
			startedAt: new Date('2026-01-05T10:00:00Z'),
			completedAt: new Date('2026-01-05T11:00:00Z'),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const result = await sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId });

		expect(result.name).toBe('Peito e Tríceps');
		expect(result.exercises).toHaveLength(1);
		expect(result.sessions).toEqual([
			expect.objectContaining({
				id: 'session-1',
				startedAt: '2026-01-05',
				completedAt: '2026-01-05',
			}),
		]);
	});

	it('should leave completedAt undefined for open sessions', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-1');

		workoutSessionsRepository.items.push({
			id: 'session-1',
			workoutDayId,
			startedAt: new Date('2026-01-05T10:00:00Z'),
			completedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const result = await sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId });

		expect(result.sessions[0].completedAt).toBeUndefined();
	});

	it('should throw NotFoundError when the day belongs to another user', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-2');

		await expect(
			sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId }),
		).rejects.toBeInstanceOf(NotFoundError);
	});
});
