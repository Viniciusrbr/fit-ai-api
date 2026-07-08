import type { Prisma, WorkoutPlan } from '@/generated/prisma/client';
import type { WeekDay } from '@/generated/prisma/enums';

export type WorkoutPlanWithDaysAndExercises = Prisma.WorkoutPlanGetPayload<{
	include: { workoutDays: { include: { exercises: true } } };
}>;

export type WorkoutPlanWithDayCounts = Prisma.WorkoutPlanGetPayload<{
	include: { workoutDays: { include: { _count: { select: { exercises: true } } } } };
}>;

export interface CreateWorkoutPlanData {
	userId: string;
	name: string;
	workoutDays: Array<{
		name: string;
		weekDay: WeekDay;
		isRest: boolean;
		estimatedDurationInSeconds: number;
		coverImageUrl?: string;
		exercises: Array<{
			order: number;
			name: string;
			sets: number;
			reps: number;
			restTimeInSeconds: number;
		}>;
	}>;
}

export interface FindManyByUserIdParams {
	userId: string;
	active?: boolean;
}

export interface FindByIdAndUserIdParams {
	workoutPlanId: string;
	userId: string;
}

export interface WorkoutPlansRepository {
	/**
	 * Cria um plano ativo para o usuário, desativando atomicamente o plano
	 * ativo anterior (invariante: um usuário tem no máximo um plano ativo).
	 */
	create(data: CreateWorkoutPlanData): Promise<WorkoutPlanWithDaysAndExercises>;
	findManyByUserId(params: FindManyByUserIdParams): Promise<WorkoutPlanWithDaysAndExercises[]>;
	findByIdAndUserId(params: FindByIdAndUserIdParams): Promise<WorkoutPlanWithDayCounts | null>;
	findById(workoutPlanId: string): Promise<WorkoutPlan | null>;
	findActiveByUserId(userId: string): Promise<WorkoutPlanWithDayCounts | null>;
}
