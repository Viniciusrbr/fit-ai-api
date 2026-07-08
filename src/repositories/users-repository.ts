import type { User } from '@/generated/prisma/client';

export interface UpdateTrainDataParams {
	userId: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number;
}

export interface UsersRepository {
	findById(userId: string): Promise<User | null>;
	updateTrainData(params: UpdateTrainDataParams): Promise<User>;
}
