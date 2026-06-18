import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { NotFoundError } from '@/errors';
import type { WeekDay } from '@/generated/prisma/enums';
import { prisma } from '@/lib/db';

dayjs.extend(utc);

const DATE_KEY_FORMAT = 'YYYY-MM-DD';

interface InputDto {
	userId: string;
	workoutPlanId: string;
	workoutDayId: string;
}

interface OutputDto {
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

export class GetWorkoutDay {
	async execute(dto: InputDto): Promise<OutputDto> {
		const workoutDay = await prisma.workoutDay.findFirst({
			where: {
				id: dto.workoutDayId,
				workoutPlanId: dto.workoutPlanId,
				workoutPlan: { userId: dto.userId },
			},
			include: {
				exercises: { orderBy: { order: 'asc' } },
				sessions: { orderBy: { startedAt: 'asc' } },
			},
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
