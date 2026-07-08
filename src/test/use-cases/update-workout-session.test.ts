import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { InMemoryWorkoutSessionsRepository } from '@/repositories/in-memory/in-memory-workout-sessions-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { UpdateWorkoutSessionUseCase } from '@/use-cases/update-workout-session';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let workoutSessionsRepository: InMemoryWorkoutSessionsRepository;
let sut: UpdateWorkoutSessionUseCase;

const createWorkoutPlanWithSession = async (userId: string) => {
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

	const workoutDayId = workoutPlan.workoutDays[0].id;
	const workoutSession = await workoutSessionsRepository.create({
		workoutDayId,
		startedAt: new Date('2026-01-05T10:00:00Z'),
	});

	return { workoutPlanId: workoutPlan.id, workoutDayId, workoutSessionId: workoutSession.id };
};

describe('Update Workout Session Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		workoutSessionsRepository = new InMemoryWorkoutSessionsRepository(workoutPlansRepository);
		sut = new UpdateWorkoutSessionUseCase(workoutSessionsRepository);
	});

	it('should complete a workout session', async () => {
		const { workoutPlanId, workoutDayId, workoutSessionId } =
			await createWorkoutPlanWithSession('user-1');

		const result = await sut.execute({
			userId: 'user-1',
			workoutPlanId,
			workoutDayId,
			workoutSessionId,
			completedAt: '2026-01-05T11:00:00Z',
		});

		expect(result.id).toBe(workoutSessionId);
		expect(result.startedAt).toBe('2026-01-05T10:00:00.000Z');
		expect(result.completedAt).toBe('2026-01-05T11:00:00.000Z');
	});

	it('should throw NotFoundError when the session does not exist', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlanWithSession('user-1');

		await expect(
			sut.execute({
				userId: 'user-1',
				workoutPlanId,
				workoutDayId,
				workoutSessionId: 'non-existing-id',
				completedAt: '2026-01-05T11:00:00Z',
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it('should throw NotFoundError when the session belongs to another user', async () => {
		const { workoutPlanId, workoutDayId, workoutSessionId } =
			await createWorkoutPlanWithSession('user-2');

		await expect(
			sut.execute({
				userId: 'user-1',
				workoutPlanId,
				workoutDayId,
				workoutSessionId,
				completedAt: '2026-01-05T11:00:00Z',
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});
});
