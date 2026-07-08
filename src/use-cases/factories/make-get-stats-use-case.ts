import { PrismaWorkoutSessionsRepository } from '@/repositories/prisma/prisma-workout-sessions-repository';
import { GetStatsUseCase } from '@/use-cases/get-stats';

export const makeGetStatsUseCase = () => {
	const workoutSessionsRepository = new PrismaWorkoutSessionsRepository();

	return new GetStatsUseCase(workoutSessionsRepository);
};
