import type { WorkoutSession } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type {
	CompleteWorkoutSessionParams,
	CreateWorkoutSessionData,
	FindByIdForUserParams,
	FindManyByUserIdBetweenParams,
	FindManyCompletedByUserIdUntilParams,
	WorkoutSessionsRepository,
} from '@/repositories/workout-sessions-repository';

export class PrismaWorkoutSessionsRepository implements WorkoutSessionsRepository {
	async create(data: CreateWorkoutSessionData): Promise<WorkoutSession> {
		return prisma.workoutSession.create({
			data: {
				id: crypto.randomUUID(),
				workoutDayId: data.workoutDayId,
				startedAt: data.startedAt,
			},
		});
	}

	async findOpenByWorkoutDayId(workoutDayId: string): Promise<WorkoutSession | null> {
		return prisma.workoutSession.findFirst({
			where: {
				workoutDayId,
				completedAt: null,
			},
		});
	}

	async findByIdForUser(params: FindByIdForUserParams): Promise<WorkoutSession | null> {
		return prisma.workoutSession.findFirst({
			where: {
				id: params.workoutSessionId,
				workoutDayId: params.workoutDayId,
				workoutDay: {
					workoutPlanId: params.workoutPlanId,
					workoutPlan: { userId: params.userId },
				},
			},
		});
	}

	async complete(params: CompleteWorkoutSessionParams): Promise<WorkoutSession> {
		return prisma.workoutSession.update({
			where: { id: params.workoutSessionId },
			data: { completedAt: params.completedAt },
		});
	}

	async findManyByUserIdBetween(params: FindManyByUserIdBetweenParams): Promise<WorkoutSession[]> {
		return prisma.workoutSession.findMany({
			where: {
				startedAt: { gte: params.from, lte: params.to },
				workoutDay: { workoutPlan: { userId: params.userId } },
			},
		});
	}

	async findManyCompletedByUserIdUntil(
		params: FindManyCompletedByUserIdUntilParams,
	): Promise<WorkoutSession[]> {
		return prisma.workoutSession.findMany({
			where: {
				completedAt: { not: null },
				startedAt: { lte: params.until },
				workoutDay: { workoutPlan: { userId: params.userId } },
			},
		});
	}
}
