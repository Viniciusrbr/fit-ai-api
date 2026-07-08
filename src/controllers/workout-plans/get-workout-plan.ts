import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GetWorkoutPlanParams } from '@/controllers/workout-plans/schemas';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { makeGetWorkoutPlanUseCase } from '@/use-cases/factories/make-get-workout-plan-use-case';

export const getWorkoutPlan = async (
	request: FastifyRequest<{ Params: GetWorkoutPlanParams }>,
	reply: FastifyReply,
) => {
	try {
		const getWorkoutPlanUseCase = makeGetWorkoutPlanUseCase();

		const result = await getWorkoutPlanUseCase.execute({
			userId: request.user.id,
			workoutPlanId: request.params.id,
		});

		return reply.status(200).send(result);
	} catch (error) {
		if (error instanceof NotFoundError) {
			return reply.status(404).send({
				error: error.message,
				code: 'NOT_FOUND_ERROR',
			});
		}

		throw error;
	}
};
