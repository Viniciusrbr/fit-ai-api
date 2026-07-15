import { beforeEach, describe, expect, it } from 'vitest';
import { WeekDay } from '@/generated/prisma/enums';
import { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import { CreateWorkoutPlanUseCase } from '@/use-cases/create-workout-plan';

let workoutPlansRepository: InMemoryWorkoutPlansRepository;
let sut: CreateWorkoutPlanUseCase;

const buildWorkoutDays = () => [
	{
		name: 'Peito e Tríceps',
		weekDay: WeekDay.MONDAY,
		isRest: false,
		exercises: [
			{ order: 2, name: 'Crucifixo', sets: 3, reps: 12, restTimeInSeconds: 60 },
			{ order: 1, name: 'Supino reto', sets: 4, reps: 10, restTimeInSeconds: 90 },
		],
	},
	{
		name: 'Descanso',
		weekDay: WeekDay.SUNDAY,
		isRest: true,
		exercises: [],
	},
];

describe('Create Workout Plan Use Case', () => {
	beforeEach(() => {
		workoutPlansRepository = new InMemoryWorkoutPlansRepository();
		sut = new CreateWorkoutPlanUseCase(workoutPlansRepository);
	});

	it('should create a workout plan with its days and exercises', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});

		expect(result.id).toEqual(expect.any(String));
		expect(result.name).toBe('Plano A');
		expect(result.workoutDays).toHaveLength(2);
		expect(workoutPlansRepository.items).toHaveLength(1);
		expect(workoutPlansRepository.items[0].isActive).toBe(true);
	});

	it('should compute estimatedDurationInSeconds from the exercises of each day', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});

		// Crucifixo: 3 * (40 + 60) = 300 | Supino reto: 4 * (40 + 90) = 520 -> total 820
		expect(result.workoutDays[0].estimatedDurationInSeconds).toBe(820);
		expect(result.workoutDays[1].estimatedDurationInSeconds).toBe(0);
	});

	it('should return exercises sorted by order', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});

		expect(result.workoutDays[0].exercises.map((exercise) => exercise.order)).toEqual([1, 2]);
	});

	it('should deactivate the previous active plan of the same user', async () => {
		const firstPlan = await sut.execute({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});

		await sut.execute({
			userId: 'user-1',
			name: 'Plano B',
			workoutDays: buildWorkoutDays(),
		});

		const storedFirstPlan = workoutPlansRepository.items.find((plan) => plan.id === firstPlan.id);
		const activePlans = workoutPlansRepository.items.filter(
			(plan) => plan.userId === 'user-1' && plan.isActive,
		);

		expect(storedFirstPlan?.isActive).toBe(false);
		expect(activePlans).toHaveLength(1);
		expect(activePlans[0].name).toBe('Plano B');
	});

	it('should not deactivate active plans of other users', async () => {
		const otherUserPlan = await sut.execute({
			userId: 'user-2',
			name: 'Plano de outro usuário',
			workoutDays: buildWorkoutDays(),
		});

		await sut.execute({
			userId: 'user-1',
			name: 'Plano A',
			workoutDays: buildWorkoutDays(),
		});

		const storedOtherUserPlan = workoutPlansRepository.items.find(
			(plan) => plan.id === otherUserPlan.id,
		);

		expect(storedOtherUserPlan?.isActive).toBe(true);
	});
});
