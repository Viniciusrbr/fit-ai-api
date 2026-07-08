import { PrismaWorkoutPlansRepository } from '@/repositories/prisma/prisma-workout-plans-repository';
import { GetWorkoutPlanUseCase } from '@/use-cases/get-workout-plan';

export const makeGetWorkoutPlanUseCase = () => {
	const workoutPlansRepository = new PrismaWorkoutPlansRepository();

	return new GetWorkoutPlanUseCase(workoutPlansRepository);
};
