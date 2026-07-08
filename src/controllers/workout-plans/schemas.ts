import z from 'zod';
import { WeekDay } from '@/generated/prisma/enums';

export const WorkoutPlanSchema = z.object({
	id: z.uuid(),
	name: z.string().trim().min(1),
	workoutDays: z.array(
		z.object({
			name: z.string().trim().min(1),
			weekDay: z.enum(WeekDay),
			isRest: z.boolean().default(false),
			estimatedDurationInSeconds: z.number().min(1),
			coverImageUrl: z.url().optional(),
			exercises: z.array(
				z.object({
					order: z.number().min(0),
					name: z.string().trim().min(1),
					sets: z.number().min(1),
					reps: z.number().min(1),
					restTimeInSeconds: z.number().min(1),
				}),
			),
		}),
	),
});

export const CreateWorkoutPlanBodySchema = WorkoutPlanSchema.omit({ id: true });
export type CreateWorkoutPlanBody = z.infer<typeof CreateWorkoutPlanBodySchema>;

export const ListWorkoutPlansQuerySchema = z.object({
	active: z.stringbool().optional(),
});
export type ListWorkoutPlansQuery = z.infer<typeof ListWorkoutPlansQuerySchema>;

export const ListWorkoutPlansResponseSchema = z.array(
	z.object({
		id: z.uuid(),
		name: z.string(),
		isActive: z.boolean(),
		workoutDays: z.array(
			z.object({
				id: z.uuid(),
				workoutPlanId: z.uuid(),
				name: z.string(),
				weekDay: z.enum(WeekDay),
				isRest: z.boolean(),
				coverImageUrl: z.url().optional(),
				estimatedDurationInSeconds: z.number(),
				exercises: z.array(
					z.object({
						id: z.uuid(),
						workoutDayId: z.uuid(),
						name: z.string(),
						order: z.number(),
						sets: z.number(),
						reps: z.number(),
						restTimeInSeconds: z.number(),
					}),
				),
			}),
		),
	}),
);

export const GetWorkoutPlanParamsSchema = z.object({
	id: z.uuid(),
});
export type GetWorkoutPlanParams = z.infer<typeof GetWorkoutPlanParamsSchema>;

export const GetWorkoutPlanResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	workoutDays: z.array(
		z.object({
			id: z.uuid(),
			weekDay: z.enum(WeekDay),
			name: z.string(),
			isRest: z.boolean(),
			coverImageUrl: z.url().optional(),
			estimatedDurationInSeconds: z.number(),
			exercisesCount: z.number(),
		}),
	),
});

export const GetWorkoutDayParamsSchema = z.object({
	workoutPlanId: z.uuid(),
	workoutDayId: z.uuid(),
});
export type GetWorkoutDayParams = z.infer<typeof GetWorkoutDayParamsSchema>;

export const GetWorkoutDayResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	isRest: z.boolean(),
	coverImageUrl: z.url().optional(),
	estimatedDurationInSeconds: z.number(),
	weekDay: z.enum(WeekDay),
	exercises: z.array(
		z.object({
			id: z.uuid(),
			workoutDayId: z.uuid(),
			name: z.string(),
			order: z.number(),
			sets: z.number(),
			reps: z.number(),
			restTimeInSeconds: z.number(),
		}),
	),
	sessions: z.array(
		z.object({
			id: z.uuid(),
			workoutDayId: z.uuid(),
			startedAt: z.iso.date().optional(),
			completedAt: z.iso.date().optional(),
		}),
	),
});

export const StartWorkoutSessionParamsSchema = z.object({
	workoutPlanId: z.uuid(),
	workoutDayId: z.uuid(),
});
export type StartWorkoutSessionParams = z.infer<typeof StartWorkoutSessionParamsSchema>;

export const StartWorkoutSessionResponseSchema = z.object({
	userWorkoutSessionId: z.uuid(),
});

export const UpdateWorkoutSessionParamsSchema = z.object({
	workoutPlanId: z.uuid(),
	workoutDayId: z.uuid(),
	workoutSessionId: z.uuid(),
});
export type UpdateWorkoutSessionParams = z.infer<typeof UpdateWorkoutSessionParamsSchema>;

export const UpdateWorkoutSessionBodySchema = z.object({
	completedAt: z.iso.datetime(),
});
export type UpdateWorkoutSessionBody = z.infer<typeof UpdateWorkoutSessionBodySchema>;

export const UpdateWorkoutSessionResponseSchema = z.object({
	id: z.uuid(),
	completedAt: z.iso.datetime(),
	startedAt: z.iso.datetime(),
});
