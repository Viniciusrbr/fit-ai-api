import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository';
import { UpsertUserTrainDataUseCase } from '@/use-cases/upsert-user-train-data';

export const makeUpsertUserTrainDataUseCase = () => {
	const usersRepository = new PrismaUsersRepository();

	return new UpsertUserTrainDataUseCase(usersRepository);
};
