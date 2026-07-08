import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import type { WeekDay } from '@/generated/prisma/enums';
import type { WorkoutDaysRepository } from '@/repositories/workout-days-repository';
import { NotFoundError } from '@/use-cases/errors/not-found-error';

dayjs.extend(utc);

const DATE_KEY_FORMAT = 'YYYY-MM-DD';

interface GetWorkoutDayUseCaseRequest {
	userId: string;
	workoutPlanId: string;
	workoutDayId: string;
}

interface GetWorkoutDayUseCaseResponse {
	id: string;
	name: string;
	isRest: boolean;
	coverImageUrl?: string;
	estimatedDurationInSeconds: number;
	weekDay: WeekDay;
	exercises: Array<{
		id: string;
		workoutDayId: string;
		name: string;
		order: number;
		sets: number;
		reps: number;
		restTimeInSeconds: number;
	}>;
	sessions: Array<{
		id: string;
		workoutDayId: string;
		startedAt?: string;
		completedAt?: string;
	}>;
}

export class GetWorkoutDayUseCase {
	constructor(private workoutDaysRepository: WorkoutDaysRepository) {}

	async execute(request: GetWorkoutDayUseCaseRequest): Promise<GetWorkoutDayUseCaseResponse> {
		const workoutDay = await this.workoutDaysRepository.findByIdWithDetails({
			workoutDayId: request.workoutDayId,
			workoutPlanId: request.workoutPlanId,
			userId: request.userId,
		});

		if (!workoutDay) {
			throw new NotFoundError('Workout day not found');
		}

		return {
			id: workoutDay.id,
			name: workoutDay.name,
			isRest: workoutDay.isRest,
			coverImageUrl: workoutDay.coverImageUrl ?? undefined,
			estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
			weekDay: workoutDay.weekDay,
			exercises: workoutDay.exercises.map((exercise) => ({
				id: exercise.id,
				workoutDayId: exercise.workoutDayId,
				name: exercise.name,
				order: exercise.order,
				sets: exercise.sets,
				reps: exercise.reps,
				restTimeInSeconds: exercise.restTimeInSeconds,
			})),
			sessions: workoutDay.sessions.map((session) => ({
				id: session.id,
				workoutDayId: session.workoutDayId,
				startedAt: dayjs.utc(session.startedAt).format(DATE_KEY_FORMAT),
				completedAt: session.completedAt
					? dayjs.utc(session.completedAt).format(DATE_KEY_FORMAT)
					: undefined,
			})),
		};
	}
}
