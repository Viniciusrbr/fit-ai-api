import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai';
import type { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import type { AiChatBody } from '@/controllers/ai/schemas';
import { SYSTEM_PROMPT } from '@/controllers/ai/system-prompt';
import { WeekDay } from '@/generated/prisma/enums';
import { coachModel } from '@/lib/ai-model';
import { makeCreateWorkoutPlanUseCase } from '@/use-cases/factories/make-create-workout-plan-use-case';
import { makeGetUserTrainDataUseCase } from '@/use-cases/factories/make-get-user-train-data-use-case';
import { makeListWorkoutPlansUseCase } from '@/use-cases/factories/make-list-workout-plans-use-case';
import { makeUpsertUserTrainDataUseCase } from '@/use-cases/factories/make-upsert-user-train-data-use-case';

export const chat = async (request: FastifyRequest<{ Body: AiChatBody }>, reply: FastifyReply) => {
	const userId = request.user.id;
	// O schema valida o formato mínimo; o restante da estrutura UIMessage é do AI SDK
	const messages = request.body.messages as unknown as UIMessage[];

	const result = streamText({
		model: coachModel,
		system: SYSTEM_PROMPT,
		messages: await convertToModelMessages(messages),
		stopWhen: stepCountIs(10),
		tools: {
			getUserTrainData: tool({
				description:
					'Busca os dados de treino do usuário autenticado (peso, altura, idade, % gordura). Retorna null se não houver dados cadastrados.',
				inputSchema: z.object({}),
				execute: async () => {
					const getUserTrainDataUseCase = makeGetUserTrainDataUseCase();
					return getUserTrainDataUseCase.execute({ userId });
				},
			}),
			updateUserTrainData: tool({
				description:
					'Atualiza os dados de treino do usuário autenticado. O peso deve ser em gramas (converter kg * 1000).',
				inputSchema: z.object({
					weightInGrams: z.number().describe('Peso do usuário em gramas (ex: 70kg = 70000)'),
					heightInCentimeters: z.number().describe('Altura do usuário em centímetros'),
					age: z.number().describe('Idade do usuário'),
					bodyFatPercentage: z
						.number()
						.int()
						.min(0)
						.max(100)
						.describe('Percentual de gordura corporal (0 a 100)'),
				}),
				execute: async (params) => {
					const upsertUserTrainDataUseCase = makeUpsertUserTrainDataUseCase();
					return upsertUserTrainDataUseCase.execute({ userId, ...params });
				},
			}),
			getWorkoutPlans: tool({
				description: 'Lista todos os planos de treino do usuário autenticado.',
				inputSchema: z.object({}),
				execute: async () => {
					const listWorkoutPlansUseCase = makeListWorkoutPlansUseCase();
					return listWorkoutPlansUseCase.execute({ userId });
				},
			}),
			createWorkoutPlan: tool({
				description: 'Cria um novo plano de treino completo para o usuário.',
				inputSchema: z.object({
					name: z.string().describe('Nome do plano de treino'),
					workoutDays: z
						.array(
							z.object({
								name: z.string().describe('Nome do dia (ex: Peito e Tríceps, Descanso)'),
								weekDay: z.enum(WeekDay).describe('Dia da semana'),
								isRest: z.boolean().describe('Se é dia de descanso (true) ou treino (false)'),
								estimatedDurationInSeconds: z
									.number()
									.describe('Duração estimada em segundos (0 para dias de descanso)'),
								coverImageUrl: z
									.string()
									.url()
									.describe(
										'URL da imagem de capa do dia de treino. Usar as URLs de superior ou inferior conforme o foco muscular do dia.',
									),
								exercises: z
									.array(
										z.object({
											order: z.number().describe('Ordem do exercício no dia'),
											name: z.string().describe('Nome do exercício'),
											sets: z.number().describe('Número de séries'),
											reps: z.number().describe('Número de repetições'),
											restTimeInSeconds: z
												.number()
												.describe('Tempo de descanso entre séries em segundos'),
										}),
									)
									.describe('Lista de exercícios (vazia para dias de descanso)'),
							}),
						)
						.describe('Array com exatamente 7 dias de treino (MONDAY a SUNDAY)'),
				}),
				execute: async (input) => {
					const createWorkoutPlanUseCase = makeCreateWorkoutPlanUseCase();
					return createWorkoutPlanUseCase.execute({
						userId,
						name: input.name,
						workoutDays: input.workoutDays,
					});
				},
			}),
		},
	});

	const response = result.toUIMessageStreamResponse();
	reply.status(response.status);
	response.headers.forEach((value, key) => {
		reply.header(key, value);
	});
	return reply.send(response.body);
};
