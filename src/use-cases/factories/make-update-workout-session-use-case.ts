import { PrismaWorkoutSessionsRepository } from '@/repositories/prisma/prisma-workout-sessions-repository';
import { UpdateWorkoutSessionUseCase } from '@/use-cases/update-workout-session';

export const makeUpdateWorkoutSessionUseCase = () => {
	const workoutSessionsRepository = new PrismaWorkoutSessionsRepository();

	return new UpdateWorkoutSessionUseCase(workoutSessionsRepository);
};
