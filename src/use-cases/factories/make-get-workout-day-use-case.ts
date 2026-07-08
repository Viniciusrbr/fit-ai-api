import { PrismaWorkoutDaysRepository } from '@/repositories/prisma/prisma-workout-days-repository';
import { GetWorkoutDayUseCase } from '@/use-cases/get-workout-day';

export const makeGetWorkoutDayUseCase = () => {
	const workoutDaysRepository = new PrismaWorkoutDaysRepository();

	return new GetWorkoutDayUseCase(workoutDaysRepository);
};
