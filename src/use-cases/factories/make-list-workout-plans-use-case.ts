import { PrismaWorkoutPlansRepository } from '@/repositories/prisma/prisma-workout-plans-repository';
import { ListWorkoutPlansUseCase } from '@/use-cases/list-workout-plans';

export const makeListWorkoutPlansUseCase = () => {
	const workoutPlansRepository = new PrismaWorkoutPlansRepository();

	return new ListWorkoutPlansUseCase(workoutPlansRepository);
};
