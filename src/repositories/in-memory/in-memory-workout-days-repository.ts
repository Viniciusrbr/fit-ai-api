import type { WorkoutDay } from '@/generated/prisma/client';
import type { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import type { InMemoryWorkoutSessionsRepository } from '@/repositories/in-memory/in-memory-workout-sessions-repository';
import type {
	FindByIdAndWorkoutPlanIdParams,
	FindByIdWithDetailsParams,
	WorkoutDaysRepository,
	WorkoutDayWithExercisesAndSessions,
} from '@/repositories/workout-days-repository';

export class InMemoryWorkoutDaysRepository implements WorkoutDaysRepository {
	constructor(
		private workoutPlansRepository: InMemoryWorkoutPlansRepository,
		private workoutSessionsRepository: InMemoryWorkoutSessionsRepository,
	) {}

	async findByIdWithDetails(
		params: FindByIdWithDetailsParams,
	): Promise<WorkoutDayWithExercisesAndSessions | null> {
		const workoutPlan = this.workoutPlansRepository.items.find(
			(plan) => plan.id === params.workoutPlanId && plan.userId === params.userId,
		);
		const workoutDay = workoutPlan?.workoutDays.find((day) => day.id === params.workoutDayId);

		if (!workoutDay) {
			return null;
		}

		const sessions = this.workoutSessionsRepository.items
			.filter((session) => session.workoutDayId === workoutDay.id)
			.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

		return { ...workoutDay, sessions };
	}

	async findByIdAndWorkoutPlanId(
		params: FindByIdAndWorkoutPlanIdParams,
	): Promise<WorkoutDay | null> {
		const workoutPlan = this.workoutPlansRepository.items.find(
			(plan) => plan.id === params.workoutPlanId,
		);

		return workoutPlan?.workoutDays.find((day) => day.id === params.workoutDayId) ?? null;
	}
}
