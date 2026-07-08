import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateWorkoutPlanBody } from '@/controllers/workout-plans/schemas';
import { makeCreateWorkoutPlanUseCase } from '@/use-cases/factories/make-create-workout-plan-use-case';

export const createWorkoutPlan = async (
	request: FastifyRequest<{ Body: CreateWorkoutPlanBody }>,
	reply: FastifyReply,
) => {
	const createWorkoutPlanUseCase = makeCreateWorkoutPlanUseCase();

	const result = await createWorkoutPlanUseCase.execute({
		userId: request.user.id,
		name: request.body.name,
		workoutDays: request.body.workoutDays,
	});

	return reply.status(201).send(result);
};
