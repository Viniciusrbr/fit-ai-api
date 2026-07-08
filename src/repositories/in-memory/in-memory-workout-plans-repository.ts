import { randomUUID } from 'node:crypto';
import type { WorkoutPlan } from '@/generated/prisma/client';
import type {
	CreateWorkoutPlanData,
	FindByIdAndUserIdParams,
	FindManyByUserIdParams,
	WorkoutPlansRepository,
	WorkoutPlanWithDayCounts,
	WorkoutPlanWithDaysAndExercises,
} from '@/repositories/workout-plans-repository';

export class InMemoryWorkoutPlansRepository implements WorkoutPlansRepository {
	public items: WorkoutPlanWithDaysAndExercises[] = [];

	// Desempata a ordenação por createdAt quando dois planos são criados no mesmo milissegundo
	private sequenceById = new Map<string, number>();
	private sequence = 0;

	async create(data: CreateWorkoutPlanData): Promise<WorkoutPlanWithDaysAndExercises> {
		for (const plan of this.items) {
			if (plan.userId === data.userId && plan.isActive) {
				plan.isActive = false;
			}
		}

		const now = new Date();
		const workoutPlanId = randomUUID();

		const workoutPlan: WorkoutPlanWithDaysAndExercises = {
			id: workoutPlanId,
			name: data.name,
			userId: data.userId,
			isActive: true,
			createdAt: now,
			updatedAt: now,
			workoutDays: data.workoutDays.map((workoutDay) => {
				const workoutDayId = randomUUID();

				return {
					id: workoutDayId,
					name: workoutDay.name,
					workoutPlanId,
					isRest: workoutDay.isRest,
					weekDay: workoutDay.weekDay,
					estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
					coverImageUrl: workoutDay.coverImageUrl ?? null,
					createdAt: now,
					updatedAt: now,
					exercises: [...workoutDay.exercises]
						.sort((a, b) => a.order - b.order)
						.map((exercise) => ({
							id: randomUUID(),
							name: exercise.name,
							order: exercise.order,
							workoutDayId,
							sets: exercise.sets,
							reps: exercise.reps,
							restTimeInSeconds: exercise.restTimeInSeconds,
							createdAt: now,
							updatedAt: now,
						})),
				};
			}),
		};

		this.sequenceById.set(workoutPlanId, this.sequence);
		this.sequence += 1;
		this.items.push(workoutPlan);

		return workoutPlan;
	}

	async findManyByUserId(
		params: FindManyByUserIdParams,
	): Promise<WorkoutPlanWithDaysAndExercises[]> {
		return this.items
			.filter(
				(plan) =>
					plan.userId === params.userId &&
					(params.active === undefined || plan.isActive === params.active),
			)
			.sort(
				(a, b) =>
					b.createdAt.getTime() - a.createdAt.getTime() ||
					(this.sequenceById.get(b.id) ?? 0) - (this.sequenceById.get(a.id) ?? 0),
			);
	}

	async findByIdAndUserId(
		params: FindByIdAndUserIdParams,
	): Promise<WorkoutPlanWithDayCounts | null> {
		const workoutPlan = this.items.find(
			(plan) => plan.id === params.workoutPlanId && plan.userId === params.userId,
		);

		return workoutPlan ? this.withDayCounts(workoutPlan) : null;
	}

	async findById(workoutPlanId: string): Promise<WorkoutPlan | null> {
		return this.items.find((plan) => plan.id === workoutPlanId) ?? null;
	}

	async findActiveByUserId(userId: string): Promise<WorkoutPlanWithDayCounts | null> {
		const workoutPlan = this.items.find((plan) => plan.userId === userId && plan.isActive);

		return workoutPlan ? this.withDayCounts(workoutPlan) : null;
	}

	private withDayCounts(workoutPlan: WorkoutPlanWithDaysAndExercises): WorkoutPlanWithDayCounts {
		return {
			...workoutPlan,
			workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
				...workoutDay,
				_count: { exercises: workoutDay.exercises.length },
			})),
		};
	}
}
