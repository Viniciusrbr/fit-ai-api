import z from 'zod';

export const AiChatBodySchema = z.object({
	messages: z.array(
		z.looseObject({
			role: z.enum(['system', 'user', 'assistant']),
		}),
	),
});
export type AiChatBody = z.infer<typeof AiChatBodySchema>;
