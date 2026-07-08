import { PrismaWorkoutPlansRepository } from '@/repositories/prisma/prisma-workout-plans-repository';
import { PrismaWorkoutSessionsRepository } from '@/repositories/prisma/prisma-workout-sessions-repository';
import { GetHomeDataUseCase } from '@/use-cases/get-home-data';

export const makeGetHomeDataUseCase = () => {
	const workoutPlansRepository = new PrismaWorkoutPlansRepository();
	const workoutSessionsRepository = new PrismaWorkoutSessionsRepository();

	return new GetHomeDataUseCase(workoutPlansRepository, workoutSessionsRepository);
};
