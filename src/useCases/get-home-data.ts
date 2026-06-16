import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { WeekDay } from '@/generated/prisma/enums';
import { prisma } from '@/lib/db';

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

interface InputDto {
	userId: string;
	date: string;
}

interface ConsistencyByDay {
	workoutDayCompleted: boolean;
	workoutDayStarted: boolean;
}

interface OutputDto {
	activeWorkoutPlanId: string | null;
	todayWorkoutDay: {
		workoutPlanId: string;
		id: string;
		name: string;
		isRest: boolean;
		weekDay: WeekDay;
		estimatedDurationInSeconds: number;
		coverImageUrl?: string;
		exercisesCount: number;
	} | null;
	workoutStreak: number;
	consistencyByDay: Record<string, ConsistencyByDay>;
}

export class GetHomeData {
	async execute(dto: InputDto): Promise<OutputDto> {
		const referenceDate = dayjs.utc(dto.date).startOf('day');
		const weekStart = referenceDate.subtract(referenceDate.day(), 'day');
		const weekEnd = weekStart.add(6, 'day').endOf('day');

		const [activePlan, weekSessions, completedSessions] = await Promise.all([
			prisma.workoutPlan.findFirst({
				where: { userId: dto.userId, isActive: true },
				include: {
					workoutDays: {
						include: { _count: { select: { exercises: true } } },
					},
				},
			}),
			prisma.workoutSession.findMany({
				where: {
					startedAt: { gte: weekStart.toDate(), lte: weekEnd.toDate() },
					workoutDay: { workoutPlan: { userId: dto.userId } },
				},
				select: { startedAt: true, completedAt: true },
			}),
			prisma.workoutSession.findMany({
				where: {
					completedAt: { not: null },
					startedAt: { lte: referenceDate.endOf('day').toDate() },
					workoutDay: { workoutPlan: { userId: dto.userId } },
				},
				select: { startedAt: true },
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
				: null,
			workoutStreak,
			consistencyByDay,
		};
	}
}
