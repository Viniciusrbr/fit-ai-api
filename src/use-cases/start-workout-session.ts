import dayjs from 'dayjs';
import type { WorkoutDaysRepository } from '@/repositories/workout-days-repository';
import type { WorkoutPlansRepository } from '@/repositories/workout-plans-repository';
import type { WorkoutSessionsRepository } from '@/repositories/workout-sessions-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { SessionAlreadyStartedError } from '@/use-cases/errors/session-already-started-error';
import { WorkoutPlanNotActiveError } from '@/use-cases/errors/workout-plan-not-active-error';

interface StartWorkoutSessionUseCaseRequest {
	userId: string;
	workoutPlanId: string;
	workoutDayId: string;
}

interface StartWorkoutSessionUseCaseResponse {
	userWorkoutSessionId: string;
}

export class StartWorkoutSessionUseCase {
	constructor(
		private workoutPlansRepository: WorkoutPlansRepository,
		private workoutDaysRepository: WorkoutDaysRepository,
		private workoutSessionsRepository: WorkoutSessionsRepository,
	) {}

	async execute(
		request: StartWorkoutSessionUseCaseRequest,
	): Promise<StartWorkoutSessionUseCaseResponse> {
		const workoutPlan = await this.workoutPlansRepository.findById(request.workoutPlanId);

		if (!workoutPlan || workoutPlan.userId !== request.userId) {
			throw new NotFoundError('Workout plan not found');
		}

		if (!workoutPlan.isActive) {
			throw new WorkoutPlanNotActiveError('Workout plan is not active');
		}

		const workoutDay = await this.workoutDaysRepository.findByIdAndWorkoutPlanId({
			workoutDayId: request.workoutDayId,
			workoutPlanId: request.workoutPlanId,
		});

		if (!workoutDay) {
			throw new NotFoundError('Workout day not found');
		}

		const existingSession = await this.workoutSessionsRepository.findOpenByWorkoutDayId(
			request.workoutDayId,
		);

		if (existingSession) {
			throw new SessionAlreadyStartedError('Workout session already started');
		}

		const workoutSession = await this.workoutSessionsRepository.create({
			workoutDayId: request.workoutDayId,
			startedAt: dayjs().toDate(),
		});

		return {
			userWorkoutSessionId: workoutSession.id,
		};
	}
}
