import type { WeekDay } from '@/generated/prisma/enums';
import type { WorkoutPlansRepository } from '@/repositories/workout-plans-repository';

interface ListWorkoutPlansUseCaseRequest {
	userId: string;
	active?: boolean;
}

interface ListWorkoutPlansUseCaseResponse {
	id: string;
	name: string;
	isActive: boolean;
	workoutDays: Array<{
		id: string;
		workoutPlanId: string;
		name: string;
		weekDay: WeekDay;
		isRest: boolean;
		coverImageUrl?: string;
		estimatedDurationInSeconds: number;
		exercises: Array<{
			id: string;
			workoutDayId: string;
			name: string;
			order: number;
			sets: number;
			reps: number;
			restTimeInSeconds: number;
		}>;
	}>;
}

export class ListWorkoutPlansUseCase {
	constructor(private workoutPlansRepository: WorkoutPlansRepository) {}

	async execute(
		request: ListWorkoutPlansUseCaseRequest,
	): Promise<ListWorkoutPlansUseCaseResponse[]> {
		const workoutPlans = await this.workoutPlansRepository.findManyByUserId({
			userId: request.userId,
			active: request.active,
		});

		return workoutPlans.map((plan) => ({
			id: plan.id,
			name: plan.name,
			isActive: plan.isActive,
			workoutDays: plan.workoutDays.map((day) => ({
				id: day.id,
				workoutPlanId: day.workoutPlanId,
				name: day.name,
				weekDay: day.weekDay,
				isRest: day.isRest,
				coverImageUrl: day.coverImageUrl ?? undefined,
				estimatedDurationInSeconds: day.estimatedDurationInSeconds,
				exercises: day.exercises.map((exercise) => ({
					id: exercise.id,
					workoutDayId: exercise.workoutDayId,
					name: exercise.name,
					order: exercise.order,
					sets: exercise.sets,
					reps: exercise.reps,
					restTimeInSeconds: exercise.restTimeInSeconds,
				})),
			})),
		}));
	}
}
