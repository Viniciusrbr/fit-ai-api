import z from 'zod';

export const GetUserTrainDataResponseSchema = z
	.object({
		userId: z.string(),
		userName: z.string(),
		weightInGrams: z.number().int(),
		heightInCentimeters: z.number().int(),
		age: z.number().int(),
		bodyFatPercentage: z.number().int(), // 100 representa 100%
	})
	.nullable();
