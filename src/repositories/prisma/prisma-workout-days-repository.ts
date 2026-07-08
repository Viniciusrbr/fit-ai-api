import type { WorkoutDay } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type {
	FindByIdAndWorkoutPlanIdParams,
	FindByIdWithDetailsParams,
	WorkoutDaysRepository,
	WorkoutDayWithExercisesAndSessions,
} from '@/repositories/workout-days-repository';

export class PrismaWorkoutDaysRepository implements WorkoutDaysRepository {
	async findByIdWithDetails(
		params: FindByIdWithDetailsParams,
	): Promise<WorkoutDayWithExercisesAndSessions | null> {
		return prisma.workoutDay.findFirst({
			where: {
				id: params.workoutDayId,
				workoutPlanId: params.workoutPlanId,
				workoutPlan: { userId: params.userId },
			},
			include: {
				exercises: { orderBy: { order: 'asc' } },
				sessions: { orderBy: { startedAt: 'asc' } },
			},
		});
	}

	async findByIdAndWorkoutPlanId(
		params: FindByIdAndWorkoutPlanIdParams,
	): Promise<WorkoutDay | null> {
		return prisma.workoutDay.findFirst({
			where: {
				id: params.workoutDayId,
				workoutPlanId: params.workoutPlanId,
			},
		});
	}
}
