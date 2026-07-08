import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutDaysRepository } from '@/repositories/in-memory/in-memory-workout-days-repository';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { InMemoryWorkoutSessionsRepository } from '@/repositories/in-memory/in-memory-workout-sessions-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { SessionAlreadyStartedError } from '@/use-cases/errors/session-already-started-error';
import { WorkoutPlanNotActiveError } from '@/use-cases/errors/workout-plan-not-active-error';
import { StartWorkoutSessionUseCase } from '@/use-cases/start-workout-session';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let workoutSessionsRepository: InMemoryWorkoutSessionsRepository;
let workoutDaysRepository: InMemoryWorkoutDaysRepository;
let sut: StartWorkoutSessionUseCase;

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
				exercises: [],
			},
		],
	});

	return { workoutPlanId: workoutPlan.id, workoutDayId: workoutPlan.workoutDays[0].id };
};

describe('Start Workout Session Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		workoutSessionsRepository = new InMemoryWorkoutSessionsRepository(workoutPlansRepository);
		workoutDaysRepository = new InMemoryWorkoutDaysRepository(
			workoutPlansRepository,
			workoutSessionsRepository,
		);
		sut = new StartWorkoutSessionUseCase(
			workoutPlansRepository,
			workoutDaysRepository,
			workoutSessionsRepository,
		);
	});

	it('should start a workout session', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-1');

		const result = await sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId });

		expect(result.userWorkoutSessionId).toEqual(expect.any(String));
		expect(workoutSessionsRepository.items).toHaveLength(1);
		expect(workoutSessionsRepository.items[0].completedAt).toBeNull();
	});

	it('should throw NotFoundError when the plan does not exist', async () => {
		await expect(
			sut.execute({
				userId: 'user-1',
				workoutPlanId: 'non-existing-id',
				workoutDayId: 'any-day-id',
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it('should throw NotFoundError when the plan belongs to another user', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-2');

		await expect(
			sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId }),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it('should throw WorkoutPlanNotActiveError when the plan is not active', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-1');

		// Criar um segundo plano desativa o primeiro
		await createWorkoutPlan('user-1');

		await expect(
			sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId }),
		).rejects.toBeInstanceOf(WorkoutPlanNotActiveError);
	});

	it('should throw NotFoundError when the day does not belong to the plan', async () => {
		const { workoutPlanId } = await createWorkoutPlan('user-1');

		await expect(
			sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId: 'non-existing-day-id' }),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it('should throw SessionAlreadyStartedError when there is an open session for the day', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-1');

		await sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId });

		await expect(
			sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId }),
		).rejects.toBeInstanceOf(SessionAlreadyStartedError);
	});

	it('should allow starting a new session after the previous one is completed', async () => {
		const { workoutPlanId, workoutDayId } = await createWorkoutPlan('user-1');

		const firstSession = await sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId });
		await workoutSessionsRepository.complete({
			workoutSessionId: firstSession.userWorkoutSessionId,
			completedAt: new Date(),
		});

		const secondSession = await sut.execute({ userId: 'user-1', workoutPlanId, workoutDayId });

		expect(secondSession.userWorkoutSessionId).toEqual(expect.any(String));
		expect(workoutSessionsRepository.items).toHaveLength(2);
	});
});
