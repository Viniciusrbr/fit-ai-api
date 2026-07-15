import type { WeekDay } from '@/generated/prisma/enums';
import type { WorkoutPlansRepository } from '@/repositories/workout-plans-repository';

// Tempo médio de execução de uma série (levantar e controlar o peso), somado
// ao descanso configurado do exercício, para estimar a duração do dia de treino
const EXECUTION_SECONDS_PER_SET = 40;

interface CreateWorkoutPlanUseCaseRequest {
	userId: string;
	name: string;
	workoutDays: Array<{
		name: string;
		weekDay: WeekDay;
		isRest: boolean;
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
			workoutDays: request.workoutDays.map((day) => ({
				...day,
				estimatedDurationInSeconds: day.isRest
					? 0
					: day.exercises.reduce(
							(total, exercise) =>
								total + exercise.sets * (EXECUTION_SECONDS_PER_SET + exercise.restTimeInSeconds),
							0,
						),
			})),
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
