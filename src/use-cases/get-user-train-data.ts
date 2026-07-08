import type { UsersRepository } from '@/repositories/users-repository';

interface GetUserTrainDataUseCaseRequest {
	userId: string;
}

interface GetUserTrainDataUseCaseResponse {
	userId: string;
	userName: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number; // 100 representa 100%
}

export class GetUserTrainDataUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute(
		request: GetUserTrainDataUseCaseRequest,
	): Promise<GetUserTrainDataUseCaseResponse | null> {
		const user = await this.usersRepository.findById(request.userId);

		// Dados de treino ainda não cadastrados
		if (
			!user ||
			user.weightInGrams === null ||
			user.heightInCentimeters === null ||
			user.age === null ||
			user.bodyFatPercentage === null
		) {
			return null;
		}

		return {
			userId: user.id,
			userName: user.name,
			weightInGrams: user.weightInGrams,
			heightInCentimeters: user.heightInCentimeters,
			age: user.age,
			bodyFatPercentage: user.bodyFatPercentage,
		};
	}
}
