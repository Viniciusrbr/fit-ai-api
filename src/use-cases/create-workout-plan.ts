import type { WeekDay } from '@/generated/prisma/enums';
import type { WorkoutPlansRepository } from '@/repositories/workout-plans-repository';

interface CreateWorkoutPlanUseCaseRequest {
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

interface CreateWorkoutPlanUseCaseResponse {
	id: string;
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

export class CreateWorkoutPlanUseCase {
	constructor(private workoutPlansRepository: WorkoutPlansRepository) {}

	async execute(
		request: CreateWorkoutPlanUseCaseRequest,
	): Promise<CreateWorkoutPlanUseCaseResponse> {
		// Regra: um usuário tem no máximo um plano ativo — o repositório troca
		// o plano ativo atomicamente ao criar o novo
		const workoutPlan = await this.workoutPlansRepository.create({
			userId: request.userId,
			name: request.name,
			workoutDays: request.workoutDays,
		});

		return {
			id: workoutPlan.id,
			name: workoutPlan.name,
			workoutDays: workoutPlan.workoutDays.map((day) => ({
				name: day.name,
				weekDay: day.weekDay,
				isRest: day.isRest,
				estimatedDurationInSeconds: day.estimatedDurationInSeconds,
				coverImageUrl: day.coverImageUrl ?? undefined,
				exercises: day.exercises.map((exercise) => ({
					order: exercise.order,
					name: exercise.name,
					sets: exercise.sets,
					reps: exercise.reps,
					restTimeInSeconds: exercise.restTimeInSeconds,
				})),
			})),
		};
	}
}
