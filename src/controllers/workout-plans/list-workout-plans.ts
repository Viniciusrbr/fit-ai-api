import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ListWorkoutPlansQuery } from '@/controllers/workout-plans/schemas';
import { makeListWorkoutPlansUseCase } from '@/use-cases/factories/make-list-workout-plans-use-case';

export const listWorkoutPlans = async (
	request: FastifyRequest<{ Querystring: ListWorkoutPlansQuery }>,
	reply: FastifyReply,
) => {
	const listWorkoutPlansUseCase = makeListWorkoutPlansUseCase();

	const result = await listWorkoutPlansUseCase.execute({
		userId: request.user.id,
		active: request.query.active,
	});

	return reply.status(200).send(result);
};
