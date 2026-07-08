import { randomUUID } from 'node:crypto';
import type { WorkoutSession } from '@/generated/prisma/client';
import type { InMemoryWorkoutPlansRepository } from '@/repositories/in-memory/in-memory-workout-plans-repository';
import type {
	CompleteWorkoutSessionParams,
	CreateWorkoutSessionData,
	FindByIdForUserParams,
	FindManyByUserIdBetweenParams,
	FindManyCompletedByUserIdUntilParams,
	WorkoutSessionsRepository,
} from '@/repositories/workout-sessions-repository';

export class InMemoryWorkoutSessionsRepository implements WorkoutSessionsRepository {
	public items: WorkoutSession[] = [];

	constructor(private workoutPlansRepository: InMemoryWorkoutPlansRepository) {}

	async create(data: CreateWorkoutSessionData): Promise<WorkoutSession> {
		const now = new Date();

		const workoutSession: WorkoutSession = {
			id: randomUUID(),
			workoutDayId: data.workoutDayId,
			startedAt: data.startedAt,
			completedAt: null,
			createdAt: now,
			updatedAt: now,
		};

		this.items.push(workoutSession);

		return workoutSession;
	}

	async findOpenByWorkoutDayId(workoutDayId: string): Promise<WorkoutSession | null> {
		return (
			this.items.find(
				(session) => session.workoutDayId === workoutDayId && session.completedAt === null,
			) ?? null
		);
	}

	async findByIdForUser(params: FindByIdForUserParams): Promise<WorkoutSession | null> {
		const workoutSession = this.items.find(
			(session) =>
				session.id === params.workoutSessionId && session.workoutDayId === params.workoutDayId,
		);

		if (!workoutSession) {
			return null;
		}

		const workoutPlan = this.workoutPlansRepository.items.find(
			(plan) => plan.id === params.workoutPlanId && plan.userId === params.userId,
		);
		const workoutDay = workoutPlan?.workoutDays.find((day) => day.id === params.workoutDayId);

		return workoutDay ? workoutSession : null;
	}

	async complete(params: CompleteWorkoutSessionParams): Promise<WorkoutSession> {
		const workoutSession = this.items.find((session) => session.id === params.workoutSessionId);

		if (!workoutSession) {
			throw new Error('Workout session not found');
		}

		workoutSession.completedAt = params.completedAt;
		workoutSession.updatedAt = new Date();

		return workoutSession;
	}

	async findManyByUserIdBetween(params: FindManyByUserIdBetweenParams): Promise<WorkoutSession[]> {
		return this.items.filter(
			(session) =>
				this.belongsToUser(session, params.userId) &&
				session.startedAt >= params.from &&
				session.startedAt <= params.to,
		);
	}

	async findManyCompletedByUserIdUntil(
		params: FindManyCompletedByUserIdUntilParams,
	): Promise<WorkoutSession[]> {
		return this.items.filter(
			(session) =>
				this.belongsToUser(session, params.userId) &&
				session.completedAt !== null &&
				session.startedAt <= params.until,
		);
	}

	private belongsToUser(session: WorkoutSession, userId: string): boolean {
		return this.workoutPlansRepository.items.some(
			(plan) =>
				plan.userId === userId && plan.workoutDays.some((day) => day.id === session.workoutDayId),
		);
	}
}
