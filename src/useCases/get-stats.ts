import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { prisma } from '@/lib/db';

dayjs.extend(utc);

const DATE_KEY_FORMAT = 'YYYY-MM-DD';

interface InputDto {
	userId: string;
	from: string;
	to: string;
}

interface ConsistencyByDay {
	workoutDayCompleted: boolean;
	workoutDayStarted: boolean;
}

interface OutputDto {
	workoutStreak: number;
	consistencyByDay: Record<string, ConsistencyByDay>;
	completedWorkoutsCount: number;
	conclusionRate: number;
	totalTimeInSeconds: number;
}

export class GetStats {
	async execute(dto: InputDto): Promise<OutputDto> {
		const from = dayjs.utc(dto.from).startOf('day');
		const to = dayjs.utc(dto.to).endOf('day');

		const sessions = await prisma.workoutSession.findMany({
			where: {
				startedAt: { gte: from.toDate(), lte: to.toDate() },
				workoutDay: { workoutPlan: { userId: dto.userId } },
			},
			select: { startedAt: true, completedAt: true },
		});

		const consistencyByDay = sessions.reduce<Record<string, ConsistencyByDay>>((acc, session) => {
			const key = dayjs.utc(session.startedAt).format(DATE_KEY_FORMAT);
			const entry = acc[key] ?? { workoutDayCompleted: false, workoutDayStarted: false };
			entry.workoutDayStarted = true;
			if (session.completedAt) {
				entry.workoutDayCompleted = true;
			}
			acc[key] = entry;
			return acc;
		}, {});

		const completedSessions = sessions.filter((session) => session.completedAt);
		const completedWorkoutsCount = completedSessions.length;
		const conclusionRate = sessions.length === 0 ? 0 : completedWorkoutsCount / sessions.length;

		const totalTimeInSeconds = completedSessions.reduce(
			(total, session) => total + dayjs.utc(session.completedAt).diff(session.startedAt, 'second'),
			0,
		);

		const workoutStreak = this.calculateStreak(
			Object.keys(consistencyByDay).filter((key) => consistencyByDay[key].workoutDayCompleted),
		);

		return {
			workoutStreak,
			consistencyByDay,
			completedWorkoutsCount,
			conclusionRate,
			totalTimeInSeconds,
		};
	}

	// Maior sequência de dias consecutivos com treino completado dentro do período
	private calculateStreak(completedDateKeys: string[]): number {
		const sortedDates = [...completedDateKeys].sort();

		let longestStreak = 0;
		let currentStreak = 0;
		let previous: dayjs.Dayjs | null = null;

		sortedDates.forEach((dateKey) => {
			const current = dayjs.utc(dateKey);
			currentStreak = previous && current.diff(previous, 'day') === 1 ? currentStreak + 1 : 1;
			previous = current;
			longestStreak = Math.max(longestStreak, currentStreak);
		});

		return longestStreak;
	}
}
