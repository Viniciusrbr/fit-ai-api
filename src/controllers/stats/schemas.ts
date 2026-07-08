import z from 'zod';

export const GetStatsQuerySchema = z.object({
	from: z.iso.date(),
	to: z.iso.date(),
});
export type GetStatsQuery = z.infer<typeof GetStatsQuerySchema>;

export const GetStatsResponseSchema = z.object({
	workoutStreak: z.number(),
	consistencyByDay: z.record(
		z.iso.date(),
		z.object({
			workoutDayCompleted: z.boolean(),
			workoutDayStarted: z.boolean(),
		}),
	),
	completedWorkoutsCount: z.number(),
	conclusionRate: z.number(),
	totalTimeInSeconds: z.number(),
});
