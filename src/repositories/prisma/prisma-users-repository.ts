import type { User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { UpdateTrainDataParams, UsersRepository } from '@/repositories/users-repository';

export class PrismaUsersRepository implements UsersRepository {
	async findById(userId: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { id: userId },
		});
	}

	async updateTrainData(params: UpdateTrainDataParams): Promise<User> {
		return prisma.user.update({
			where: { id: params.userId },
			data: {
				weightInGrams: params.weightInGrams,
				heightInCentimeters: params.heightInCentimeters,
				age: params.age,
				bodyFatPercentage: params.bodyFatPercentage,
			},
		});
	}
}
