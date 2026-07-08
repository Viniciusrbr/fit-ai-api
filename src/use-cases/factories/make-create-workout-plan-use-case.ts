import { PrismaWorkoutPlansRepository } from '@/repositories/prisma/prisma-workout-plans-repository';
import { CreateWorkoutPlanUseCase } from '@/use-cases/create-workout-plan';

export const makeCreateWorkoutPlanUseCase = () => {
	const workoutPlansRepository = new PrismaWorkoutPlansRepository();

	return new CreateWorkoutPlanUseCase(workoutPlansRepository);
};
