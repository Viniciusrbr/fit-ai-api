import z from 'zod';
import { WeekDay } from '@/generated/prisma/enums';

export const HomeParamsSchema = z.object({
	date: z.iso.date(),
});
export type HomeParams = z.infer<typeof HomeParamsSchema>;

export const HomeResponseSchema = z.object({
	activeWorkoutPlanId: z.uuid().nullable(),
	todayWorkoutDay: z
		.object({
			workoutPlanId: z.uuid(),
			id: z.uuid(),
			name: z.string(),
			isRest: z.boolean(),
			weekDay: z.enum(WeekDay),
			estimatedDurationInSeconds: z.number(),
			coverImageUrl: z.url().optional(),
			exercisesCount: z.number(),
		})
		.optional(),
	workoutStreak: z.number(),
	consistencyByDay: z.record(
		z.iso.date(),
		z.object({
			workoutDayCompleted: z.boolean(),
			workoutDayStarted: z.boolean(),
		}),
	),
});
