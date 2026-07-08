import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { WeekDay } from '@/generated/prisma/enums';
import type { WorkoutPlansRepository } from '@/repositories/workout-plans-repository';
import type { WorkoutSessionsRepository } from '@/repositories/workout-sessions-repository';

dayjs.extend(utc);

// Índice de dayjs (0 = domingo ... 6 = sábado) -> enum WeekDay do Prisma
const WEEK_DAY_BY_INDEX: WeekDay[] = [
	WeekDay.SUNDAY,
	WeekDay.MONDAY,
	WeekDay.TUESDAY,
	WeekDay.WEDNESDAY,
	WeekDay.THURSDAY,
	WeekDay.FRIDAY,
	WeekDay.SATURDAY,
];

const DATE_KEY_FORMAT = 'YYYY-MM-DD';

interface GetHomeDataUseCaseRequest {
	userId: string;
	date: string;
}

interface ConsistencyByDay {
	workoutDayCompleted: boolean;
	workoutDayStarted: boolean;
}

interface GetHomeDataUseCaseResponse {
	activeWorkoutPlanId: string | null;
	todayWorkoutDay?: {
		workoutPlanId: string;
		id: string;
		name: string;
		isRest: boolean;
		weekDay: WeekDay;
		estimatedDurationInSeconds: number;
		coverImageUrl?: string;
		exercisesCount: number;
	};
	workoutStreak: number;
	consistencyByDay: Record<string, ConsistencyByDay>;
}

export class GetHomeDataUseCase {
	constructor(
		private workoutPlansRepository: WorkoutPlansRepository,
		private workoutSessionsRepository: WorkoutSessionsRepository,
	) {}

	async execute(request: GetHomeDataUseCaseRequest): Promise<GetHomeDataUseCaseResponse> {
		const referenceDate = dayjs.utc(request.date).startOf('day');
		const weekStart = referenceDate.subtract(referenceDate.day(), 'day');
		const weekEnd = weekStart.add(6, 'day').endOf('day');

		const [activePlan, weekSessions, completedSessions] = await Promise.all([
			this.workoutPlansRepository.findActiveByUserId(request.userId),
			this.workoutSessionsRepository.findManyByUserIdBetween({
				userId: request.userId,
				from: weekStart.toDate(),
				to: weekEnd.toDate(),
			}),
			this.workoutSessionsRepository.findManyCompletedByUserIdUntil({
				userId: request.userId,
				until: referenceDate.endOf('day').toDate(),
			}),
		]);

		const todayWeekDay = WEEK_DAY_BY_INDEX[referenceDate.day()];
		const matchingDay = activePlan?.workoutDays.find((day) => day.weekDay === todayWeekDay) ?? null;

		const consistencyByDay: Record<string, ConsistencyByDay> = Object.fromEntries(
			Array.from({ length: 7 }, (_, index) => [
				weekStart.add(index, 'day').format(DATE_KEY_FORMAT),
				{ workoutDayCompleted: false, workoutDayStarted: false },
			]),
		);

		weekSessions.forEach((session) => {
			const key = dayjs.utc(session.startedAt).format(DATE_KEY_FORMAT);
			const entry = consistencyByDay[key];
			if (!entry) {
				return;
			}
			entry.workoutDayStarted = true;
			if (session.completedAt) {
				entry.workoutDayCompleted = true;
			}
		});

		const completedDates = new Set(
			completedSessions.map((session) => dayjs.utc(session.startedAt).format(DATE_KEY_FORMAT)),
		);

		let workoutStreak = 0;
		let cursor = referenceDate;
		while (completedDates.has(cursor.format(DATE_KEY_FORMAT))) {
			workoutStreak += 1;
			cursor = cursor.subtract(1, 'day');
		}

		return {
			activeWorkoutPlanId: activePlan?.id ?? null,
			todayWorkoutDay: matchingDay
				? {
						workoutPlanId: matchingDay.workoutPlanId,
						id: matchingDay.id,
						name: matchingDay.name,
						isRest: matchingDay.isRest,
						weekDay: matchingDay.weekDay,
						estimatedDurationInSeconds: matchingDay.estimatedDurationInSeconds,
						coverImageUrl: matchingDay.coverImageUrl ?? undefined,
						exercisesCount: matchingDay._count.exercises,
					}
				: undefined,
			workoutStreak,
			consistencyByDay,
		};
	}
}
