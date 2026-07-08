import type { Prisma, WorkoutDay } from '@/generated/prisma/client';

export type WorkoutDayWithExercisesAndSessions = Prisma.WorkoutDayGetPayload<{
	include: { exercises: true; sessions: true };
}>;

export interface FindByIdWithDetailsParams {
	workoutDayId: string;
	workoutPlanId: string;
	userId: string;
}

export interface FindByIdAndWorkoutPlanIdParams {
	workoutDayId: string;
	workoutPlanId: string;
}

export interface WorkoutDaysRepository {
	findByIdWithDetails(
		params: FindByIdWithDetailsParams,
	): Promise<WorkoutDayWithExercisesAndSessions | null>;
	findByIdAndWorkoutPlanId(params: FindByIdAndWorkoutPlanIdParams): Promise<WorkoutDay | null>;
}
