import z from 'zod';
import { WeekDay } from '@/generated/prisma/enums';

// Params compartilhados pelas rotas aninhadas de plano -> dia -> sessão
const WorkoutPlanIdParam = z.uuid().meta({ description: 'ID do plano de treino' });
const WorkoutDayIdParam = z.uuid().meta({ description: 'ID do dia de treino (dentro do plano)' });
const WorkoutSessionIdParam = z.uuid().meta({
	description: 'ID da sessão, retornado ao iniciar o treino',
});

// Registrado com id: vira um componente reutilizável (seção "Models" do Scalar)
const WorkoutExerciseSchema = z
	.object({
		id: z.uuid(),
		workoutDayId: z.uuid(),
		name: z.string(),
		order: z.number(),
		sets: z.number(),
		reps: z.number(),
		restTimeInSeconds: z.number(),
	})
	.meta({ id: 'WorkoutExercise', description: 'Exercício de um dia de treino' });

export const WorkoutPlanSchema = z.object({
	id: z.uuid(),
	name: z.string().trim().min(1).meta({ description: 'Nome do plano', example: 'Hipertrofia ABC' }),
	workoutDays: z.array(
		z.object({
			name: z
				.string()
				.trim()
				.min(1)
				.meta({ description: 'Nome do dia', example: 'Peito e Tríceps' }),
			weekDay: z.enum(WeekDay).meta({ description: 'Dia da semana', example: 'MONDAY' }),
			isRest: z.boolean().default(false).meta({ description: 'Se é um dia de descanso' }),
			estimatedDurationInSeconds: z.number().min(1).meta({
				description:
					'Calculado pela API: séries × (40 s de execução + descanso). Dias de descanso ficam com 0.',
			}),
			coverImageUrl: z.url().optional().meta({ description: 'URL da imagem de capa do dia' }),
			exercises: z.array(
				z.object({
					order: z
						.number()
						.min(0)
						.meta({ description: 'Posição do exercício no dia, começando em 0', example: 0 }),
					name: z
						.string()
						.trim()
						.min(1)
						.meta({ description: 'Nome do exercício', example: 'Supino reto' }),
					sets: z.number().min(1).meta({ description: 'Número de séries', example: 4 }),
					reps: z.number().min(1).meta({ description: 'Repetições por série', example: 12 }),
					restTimeInSeconds: z
						.number()
						.min(1)
						.meta({ description: 'Descanso entre séries, em segundos', example: 60 }),
				}),
			),
		}),
	),
});

export const CreateWorkoutPlanBodySchema = WorkoutPlanSchema.omit({ id: true }).extend({
	workoutDays: z.array(
		WorkoutPlanSchema.shape.workoutDays.element.omit({ estimatedDurationInSeconds: true }),
	),
});
export type CreateWorkoutPlanBody = z.infer<typeof CreateWorkoutPlanBodySchema>;

export const ListWorkoutPlansQuerySchema = z.object({
	active: z.stringbool().optional().meta({
		description:
			'`true` retorna só o plano ativo, `false` só os inativos. Sem o filtro, retorna todos.',
		example: 'true',
	}),
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
				exercises: z.array(WorkoutExerciseSchema),
			}),
		),
	}),
);

export const GetWorkoutPlanParamsSchema = z.object({
	id: WorkoutPlanIdParam,
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
	workoutPlanId: WorkoutPlanIdParam,
	workoutDayId: WorkoutDayIdParam,
});
export type GetWorkoutDayParams = z.infer<typeof GetWorkoutDayParamsSchema>;

export const GetWorkoutDayResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	isRest: z.boolean(),
	coverImageUrl: z.url().optional(),
	estimatedDurationInSeconds: z.number(),
	weekDay: z.enum(WeekDay),
	exercises: z.array(WorkoutExerciseSchema),
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
	workoutPlanId: WorkoutPlanIdParam,
	workoutDayId: WorkoutDayIdParam,
});
export type StartWorkoutSessionParams = z.infer<typeof StartWorkoutSessionParamsSchema>;

export const StartWorkoutSessionResponseSchema = z
	.object({
		userWorkoutSessionId: z.uuid().meta({
			description: 'ID da sessão criada. Use no `PATCH` para concluir o treino.',
		}),
	})
	.meta({ description: 'Sessão iniciada' });

export const UpdateWorkoutSessionParamsSchema = z.object({
	workoutPlanId: WorkoutPlanIdParam,
	workoutDayId: WorkoutDayIdParam,
	workoutSessionId: WorkoutSessionIdParam,
});
export type UpdateWorkoutSessionParams = z.infer<typeof UpdateWorkoutSessionParamsSchema>;

export const UpdateWorkoutSessionBodySchema = z.object({
	completedAt: z.iso.datetime().meta({
		description: 'Momento em que o treino terminou, em UTC (ISO 8601 terminando com `Z`)',
		example: '2026-11-01T18:45:00.000Z',
	}),
});
export type UpdateWorkoutSessionBody = z.infer<typeof UpdateWorkoutSessionBodySchema>;

export const UpdateWorkoutSessionResponseSchema = z.object({
	id: z.uuid(),
	completedAt: z.iso.datetime(),
	startedAt: z.iso.datetime(),
});
