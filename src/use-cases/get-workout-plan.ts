import type { WeekDay } from '@/generated/prisma/enums';
import type { WorkoutPlansRepository } from '@/repositories/workout-plans-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';

interface GetWorkoutPlanUseCaseRequest {
	userId: string;
	workoutPlanId: string;
}

interface GetWorkoutPlanUseCaseResponse {
	id: string;
	name: string;
	workoutDays: Array<{
		id: string;
		weekDay: WeekDay;
		name: string;
		isRest: boolean;
		coverImageUrl?: string;
		estimatedDurationInSeconds: number;
		exercisesCount: number;
	}>;
}

export class GetWorkoutPlanUseCase {
	constructor(private workoutPlansRepository: WorkoutPlansRepository) {}

	async execute(request: GetWorkoutPlanUseCaseRequest): Promise<GetWorkoutPlanUseCaseResponse> {
		const workoutPlan = await this.workoutPlansRepository.findByIdAndUserId({
			workoutPlanId: request.workoutPlanId,
			userId: request.userId,
		});

		if (!workoutPlan) {
			throw new NotFoundError('Workout plan not found');
		}

		return {
			id: workoutPlan.id,
			name: workoutPlan.name,
			workoutDays: workoutPlan.workoutDays.map((day) => ({
				id: day.id,
				weekDay: day.weekDay,
				name: day.name,
				isRest: day.isRest,
				coverImageUrl: day.coverImageUrl ?? undefined,
				estimatedDurationInSeconds: day.estimatedDurationInSeconds,
				exercisesCount: day._count.exercises,
			})),
		};
	}
}
