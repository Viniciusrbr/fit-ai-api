import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { InMemoryWorkoutSessionsRepository } from '@/repositories/in-memory/in-memory-workout-sessions-repository';
import { GetHomeDataUseCase } from '@/use-cases/get-home-data';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let workoutSessionsRepository: InMemoryWorkoutSessionsRepository;
let sut: GetHomeDataUseCase;

// 2026-01-07 é uma quarta-feira (WEDNESDAY)
const REFERENCE_DATE = '2026-01-07';

const createWorkoutPlan = async (userId: string) => {
	return workoutPlansRepository.create({
		userId,
		name: 'Plano A',
		workoutDays: [
			{
				name: 'Peito e Tríceps',
				weekDay: WeekDay.WEDNESDAY,
				isRest: false,
				estimatedDurationInSeconds: 3600,
				exercises: [{ order: 1, name: 'Supino reto', sets: 4, reps: 10, restTimeInSeconds: 90 }],
			},
		],
	});
};

const pushSession = (workoutDayId: string, startedAt: string, completedAt: string | null) => {
	workoutSessionsRepository.items.push({
		id: crypto.randomUUID(),
		workoutDayId,
		startedAt: new Date(startedAt),
		completedAt: completedAt ? new Date(completedAt) : null,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
};

describe('Get Home Data Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		workoutSessionsRepository = new InMemoryWorkoutSessionsRepository(workoutPlansRepository);
		sut = new GetHomeDataUseCase(workoutPlansRepository, workoutSessionsRepository);
	});

	it('should return an empty state when the user has no active plan', async () => {
		const result = await sut.execute({ userId: 'user-1', date: REFERENCE_DATE });

		expect(result.activeWorkoutPlanId).toBeNull();
		expect(result.todayWorkoutDay).toBeUndefined();
		expect(result.workoutStreak).toBe(0);
		expect(Object.keys(result.consistencyByDay)).toHaveLength(7);
	});

	it('should return the workout day matching the reference date week day', async () => {
		const workoutPlan = await createWorkoutPlan('user-1');

		const result = await sut.execute({ userId: 'user-1', date: REFERENCE_DATE });

		expect(result.activeWorkoutPlanId).toBe(workoutPlan.id);
		expect(result.todayWorkoutDay).toEqual(
			expect.objectContaining({
				id: workoutPlan.workoutDays[0].id,
				weekDay: WeekDay.WEDNESDAY,
				exercisesCount: 1,
			}),
		);
	});

	it('should compute the week consistency and the streak ending on the reference date', async () => {
		const workoutPlan = await createWorkoutPlan('user-1');
		const workoutDayId = workoutPlan.workoutDays[0].id;

		pushSession(workoutDayId, '2026-01-06T10:00:00Z', '2026-01-06T11:00:00Z');
		pushSession(workoutDayId, '2026-01-07T10:00:00Z', '2026-01-07T11:00:00Z');
		pushSession(workoutDayId, '2026-01-08T10:00:00Z', null);

		const result = await sut.execute({ userId: 'user-1', date: REFERENCE_DATE });

		expect(result.workoutStreak).toBe(2);
		expect(result.consistencyByDay['2026-01-06']).toEqual({
			workoutDayCompleted: true,
			workoutDayStarted: true,
		});
		expect(result.consistencyByDay['2026-01-08']).toEqual({
			workoutDayCompleted: false,
			workoutDayStarted: true,
		});
		// A semana exibida vai de domingo (04) a sábado (10)
		expect(Object.keys(result.consistencyByDay)).toEqual([
			'2026-01-04',
			'2026-01-05',
			'2026-01-06',
			'2026-01-07',
			'2026-01-08',
			'2026-01-09',
			'2026-01-10',
		]);
	});

	it('should break the streak when a day has no completed session', async () => {
		const workoutPlan = await createWorkoutPlan('user-1');
		const workoutDayId = workoutPlan.workoutDays[0].id;

		pushSession(workoutDayId, '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z');
		pushSession(workoutDayId, '2026-01-07T10:00:00Z', '2026-01-07T11:00:00Z');

		const result = await sut.execute({ userId: 'user-1', date: REFERENCE_DATE });

		expect(result.workoutStreak).toBe(1);
	});
});
