import { PrismaWorkoutDaysRepository } from '@/repositories/prisma/prisma-workout-days-repository';
import { PrismaWorkoutPlansRepository } from '@/repositories/prisma/prisma-workout-plans-repository';
import { PrismaWorkoutSessionsRepository } from '@/repositories/prisma/prisma-workout-sessions-repository';
import { StartWorkoutSessionUseCase } from '@/use-cases/start-workout-session';

export const makeStartWorkoutSessionUseCase = () => {
	const workoutPlansRepository = new PrismaWorkoutPlansRepository();
	const workoutDaysRepository = new PrismaWorkoutDaysRepository();
	const workoutSessionsRepository = new PrismaWorkoutSessionsRepository();

	return new StartWorkoutSessionUseCase(
		workoutPlansRepository,
		workoutDaysRepository,
		workoutSessionsRepository,
	);
};
