import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { InMemoryWorkoutSessionsRepository } from '@/repositories/in-memory/in-memory-workout-sessions-repository';
import { GetStatsUseCase } from '@/use-cases/get-stats';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let workoutSessionsRepository: InMemoryWorkoutSessionsRepository;
let sut: GetStatsUseCase;

const createWorkoutDay = async (userId: string) => {
	const workoutPlan = await workoutPlansRepository.create({
		userId,
		name: 'Plano A',
		workoutDays: [
			{
				name: 'Peito e Tríceps',
				weekDay: WeekDay.MONDAY,
				isRest: false,
				estimatedDurationInSeconds: 3600,
				exercises: [],
			},
		],
	});

	return workoutPlan.workoutDays[0].id;
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

describe('Get Stats Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		workoutSessionsRepository = new InMemoryWorkoutSessionsRepository(workoutPlansRepository);
		sut = new GetStatsUseCase(workoutSessionsRepository);
	});

	it('should return zeroed stats when there are no sessions', async () => {
		const result = await sut.execute({ userId: 'user-1', from: '2026-01-01', to: '2026-01-31' });

		expect(result).toEqual({
			workoutStreak: 0,
			consistencyByDay: {},
			completedWorkoutsCount: 0,
			conclusionRate: 0,
			totalTimeInSeconds: 0,
		});
	});

	it('should compute consistency, conclusion rate, total time and streak', async () => {
		const workoutDayId = await createWorkoutDay('user-1');

		pushSession(workoutDayId, '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z');
		pushSession(workoutDayId, '2026-01-06T10:00:00Z', '2026-01-06T10:30:00Z');
		pushSession(workoutDayId, '2026-01-08T10:00:00Z', null);

		const result = await sut.execute({ userId: 'user-1', from: '2026-01-01', to: '2026-01-31' });

		expect(result.completedWorkoutsCount).toBe(2);
		expect(result.conclusionRate).toBeCloseTo(2 / 3);
		expect(result.totalTimeInSeconds).toBe(3600 + 1800);
		expect(result.workoutStreak).toBe(2);
		expect(result.consistencyByDay).toEqual({
			'2026-01-05': { workoutDayCompleted: true, workoutDayStarted: true },
			'2026-01-06': { workoutDayCompleted: true, workoutDayStarted: true },
			'2026-01-08': { workoutDayCompleted: false, workoutDayStarted: true },
		});
	});

	it('should ignore sessions outside the period and from other users', async () => {
		const workoutDayId = await createWorkoutDay('user-1');
		const otherUserWorkoutDayId = await createWorkoutDay('user-2');

		pushSession(workoutDayId, '2025-12-31T10:00:00Z', '2025-12-31T11:00:00Z');
		pushSession(otherUserWorkoutDayId, '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z');

		const result = await sut.execute({ userId: 'user-1', from: '2026-01-01', to: '2026-01-31' });

		expect(result.consistencyByDay).toEqual({});
		expect(result.completedWorkoutsCount).toBe(0);
	});

	it('should compute the longest streak of consecutive completed days', async () => {
		const workoutDayId = await createWorkoutDay('user-1');

		pushSession(workoutDayId, '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z');
		pushSession(workoutDayId, '2026-01-10T10:00:00Z', '2026-01-10T11:00:00Z');
		pushSession(workoutDayId, '2026-01-11T10:00:00Z', '2026-01-11T11:00:00Z');
		pushSession(workoutDayId, '2026-01-12T10:00:00Z', '2026-01-12T11:00:00Z');

		const result = await sut.execute({ userId: 'user-1', from: '2026-01-01', to: '2026-01-31' });

		expect(result.workoutStreak).toBe(3);
	});
});
