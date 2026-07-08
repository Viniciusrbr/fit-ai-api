import dayjs from 'dayjs';
import type { WorkoutSessionsRepository } from '@/repositories/workout-sessions-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';

interface UpdateWorkoutSessionUseCaseRequest {
	userId: string;
	workoutPlanId: string;
	workoutDayId: string;
	workoutSessionId: string;
	completedAt: string;
}

interface UpdateWorkoutSessionUseCaseResponse {
	id: string;
	completedAt: string;
	startedAt: string;
}

export class UpdateWorkoutSessionUseCase {
	constructor(private workoutSessionsRepository: WorkoutSessionsRepository) {}

	async execute(
		request: UpdateWorkoutSessionUseCaseRequest,
	): Promise<UpdateWorkoutSessionUseCaseResponse> {
		const workoutSession = await this.workoutSessionsRepository.findByIdForUser({
			workoutSessionId: request.workoutSessionId,
			workoutDayId: request.workoutDayId,
			workoutPlanId: request.workoutPlanId,
			userId: request.userId,
		});

		if (!workoutSession) {
			throw new NotFoundError('Workout session not found');
		}

		const updatedWorkoutSession = await this.workoutSessionsRepository.complete({
			workoutSessionId: workoutSession.id,
			completedAt: dayjs(request.completedAt).toDate(),
		});

		return {
			id: updatedWorkoutSession.id,
			completedAt: dayjs(updatedWorkoutSession.completedAt).toISOString(),
			startedAt: dayjs(updatedWorkoutSession.startedAt).toISOString(),
		};
	}
}
