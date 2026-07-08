import type { WorkoutSession } from '@/generated/prisma/client';

export interface CreateWorkoutSessionData {
	workoutDayId: string;
	startedAt: Date;
}

export interface FindByIdForUserParams {
	workoutSessionId: string;
	workoutDayId: string;
	workoutPlanId: string;
	userId: string;
}

export interface CompleteWorkoutSessionParams {
	workoutSessionId: string;
	completedAt: Date;
}

export interface FindManyByUserIdBetweenParams {
	userId: string;
	from: Date;
	to: Date;
}

export interface FindManyCompletedByUserIdUntilParams {
	userId: string;
	until: Date;
}

export interface WorkoutSessionsRepository {
	create(data: CreateWorkoutSessionData): Promise<WorkoutSession>;
	findOpenByWorkoutDayId(workoutDayId: string): Promise<WorkoutSession | null>;
	findByIdForUser(params: FindByIdForUserParams): Promise<WorkoutSession | null>;
	complete(params: CompleteWorkoutSessionParams): Promise<WorkoutSession>;
	findManyByUserIdBetween(params: FindManyByUserIdBetweenParams): Promise<WorkoutSession[]>;
	findManyCompletedByUserIdUntil(
		params: FindManyCompletedByUserIdUntilParams,
	): Promise<WorkoutSession[]>;
}
