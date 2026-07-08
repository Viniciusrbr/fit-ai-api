import type { User } from '@/generated/prisma/client';
import type { UpdateTrainDataParams, UsersRepository } from '@/repositories/users-repository';

export class InMemoryUsersRepository implements UsersRepository {
	public items: User[] = [];

	async findById(userId: string): Promise<User | null> {
		return this.items.find((user) => user.id === userId) ?? null;
	}

	async updateTrainData(params: UpdateTrainDataParams): Promise<User> {
		const user = this.items.find((item) => item.id === params.userId);

		if (!user) {
			throw new Error('User not found');
		}

		user.weightInGrams = params.weightInGrams;
		user.heightInCentimeters = params.heightInCentimeters;
		user.age = params.age;
		user.bodyFatPercentage = params.bodyFatPercentage;
		user.updatedAt = new Date();

		return user;
	}
}
