import type { WorkoutPlan } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type {
	CreateWorkoutPlanData,
	FindByIdAndUserIdParams,
	FindManyByUserIdParams,
	WorkoutPlansRepository,
	WorkoutPlanWithDayCounts,
	WorkoutPlanWithDaysAndExercises,
} from '@/repositories/workout-plans-repository';

export class PrismaWorkoutPlansRepository implements WorkoutPlansRepository {
	async create(data: CreateWorkoutPlanData): Promise<WorkoutPlanWithDaysAndExercises> {
		// Transaction - Atomicidade: desativa o plano ativo anterior e cria o novo
		return prisma.$transaction(async (tx) => {
			await tx.workoutPlan.updateMany({
				where: { userId: data.userId, isActive: true },
				data: { isActive: false },
			});

			return tx.workoutPlan.create({
				data: {
					id: crypto.randomUUID(),
					name: data.name,
					userId: data.userId,
					isActive: true,
					workoutDays: {
						create: data.workoutDays.map((workoutDay) => ({
							name: workoutDay.name,
							weekDay: workoutDay.weekDay,
							isRest: workoutDay.isRest,
							estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
							coverImageUrl: workoutDay.coverImageUrl,
							exercises: {
								create: workoutDay.exercises.map((exercise) => ({
									name: exercise.name,
									order: exercise.order,
									sets: exercise.sets,
									reps: exercise.reps,
									restTimeInSeconds: exercise.restTimeInSeconds,
								})),
							},
						})),
					},
				},
				include: {
					workoutDays: {
						include: { exercises: { orderBy: { order: 'asc' } } },
					},
				},
			});
		});
	}

	async findManyByUserId(
		params: FindManyByUserIdParams,
	): Promise<WorkoutPlanWithDaysAndExercises[]> {
		return prisma.workoutPlan.findMany({
			where: {
				userId: params.userId,
				...(params.active === undefined ? {} : { isActive: params.active }),
			},
			orderBy: { createdAt: 'desc' },
			include: {
				workoutDays: {
					include: { exercises: { orderBy: { order: 'asc' } } },
				},
			},
		});
	}

	async findByIdAndUserId(
		params: FindByIdAndUserIdParams,
	): Promise<WorkoutPlanWithDayCounts | null> {
		return prisma.workoutPlan.findFirst({
			where: { id: params.workoutPlanId, userId: params.userId },
			include: {
				workoutDays: {
					include: { _count: { select: { exercises: true } } },
				},
			},
		});
	}

	async findById(workoutPlanId: string): Promise<WorkoutPlan | null> {
		return prisma.workoutPlan.findUnique({
			where: { id: workoutPlanId },
		});
	}

	async findActiveByUserId(userId: string): Promise<WorkoutPlanWithDayCounts | null> {
		return prisma.workoutPlan.findFirst({
			where: { userId, isActive: true },
			include: {
				workoutDays: {
					include: { _count: { select: { exercises: true } } },
				},
			},
		});
	}
}
