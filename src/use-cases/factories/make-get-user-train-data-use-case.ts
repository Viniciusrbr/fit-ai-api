import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository';
import { GetUserTrainDataUseCase } from '@/use-cases/get-user-train-data';

export const makeGetUserTrainDataUseCase = () => {
	const usersRepository = new PrismaUsersRepository();

	return new GetUserTrainDataUseCase(usersRepository);
};
