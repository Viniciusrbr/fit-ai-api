import type { UsersRepository } from '@/repositories/users-repository';

interface UpsertUserTrainDataUseCaseRequest {
	userId: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number; // 100 representa 100%
}

interface UpsertUserTrainDataUseCaseResponse {
	userId: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number; // 100 representa 100%
}

export class UpsertUserTrainDataUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute(
		request: UpsertUserTrainDataUseCaseRequest,
	): Promise<UpsertUserTrainDataUseCaseResponse> {
		const user = await this.usersRepository.updateTrainData({
			userId: request.userId,
			weightInGrams: request.weightInGrams,
			heightInCentimeters: request.heightInCentimeters,
			age: request.age,
			bodyFatPercentage: request.bodyFatPercentage,
		});

		return {
			userId: user.id,
			weightInGrams: user.weightInGrams ?? request.weightInGrams,
			heightInCentimeters: user.heightInCentimeters ?? request.heightInCentimeters,
			age: user.age ?? request.age,
			bodyFatPercentage: user.bodyFatPercentage ?? request.bodyFatPercentage,
		};
	}
}
