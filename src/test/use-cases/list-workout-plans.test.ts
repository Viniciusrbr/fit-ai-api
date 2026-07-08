import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { ListWorkoutPlansUseCase } from '@/use-cases/list-workout-plans';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let sut: ListWorkoutPlansUseCase;

const buildWorkoutDays = () => [
	{
		name: 'Peito e Tríceps',
		weekDay: WeekDay.MONDAY,
		isRest: false,
		estimatedDurationInSeconds: 3600,
		exercises: [{ order: 1, name: 'Supino reto', sets: 4, reps: 10, restTimeInSeconds: 90 }],
	},
];

describe('List Workout Plans Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		sut = new ListWorkoutPlansUseCase(workoutPlansRepository);
	});

	it('should list only the plans of the given user, newest first', async () => {
		await workoutPlansRepository.create({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});
		await workoutPlansRepository.create({
			userId: 'user-1',
			name: 'Plano B',
			workoutDays: buildWorkoutDays(),
		});
		await workoutPlansRepository.create({
			userId: 'user-2',
			name: 'Plano de outro usuário',
			workoutDays: buildWorkoutDays(),
		});

		const result = await sut.execute({ userId: 'user-1' });

		expect(result).toHaveLength(2);
		expect(result.map((plan) => plan.name)).toEqual(['Plano B', 'Plano A']);
	});

	it('should filter by active status', async () => {
		await workoutPlansRepository.create({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});
		await workoutPlansRepository.create({
			userId: 'user-1',
			name: 'Plano B',
			workoutDays: buildWorkoutDays(),
		});

		const activePlans = await sut.execute({ userId: 'user-1', active: true });
		const inactivePlans = await sut.execute({ userId: 'user-1', active: false });

		expect(activePlans).toHaveLength(1);
		expect(activePlans[0].name).toBe('Plano B');
		expect(inactivePlans).toHaveLength(1);
		expect(inactivePlans[0].name).toBe('Plano A');
	});

	it('should map days and exercises to the response DTO', async () => {
		await workoutPlansRepository.create({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});

		const [plan] = await sut.execute({ userId: 'user-1' });

		expect(plan.workoutDays[0]).toEqual(
			expect.objectContaining({
				name: 'Peito e Tríceps',
				weekDay: WeekDay.MONDAY,
				coverImageUrl: undefined,
			}),
		);
		expect(plan.workoutDays[0].exercises[0]).toEqual(
			expect.objectContaining({ name: 'Supino reto', sets: 4 }),
		);
	});
});
