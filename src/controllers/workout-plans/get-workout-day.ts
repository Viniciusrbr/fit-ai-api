import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GetWorkoutDayParams } from '@/controllers/workout-plans/schemas';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { makeGetWorkoutDayUseCase } from '@/use-cases/factories/make-get-workout-day-use-case';

export const getWorkoutDay = async (
	request: FastifyRequest<{ Params: GetWorkoutDayParams }>,
	reply: FastifyReply,
) => {
	try {
		const getWorkoutDayUseCase = makeGetWorkoutDayUseCase();

		const result = await getWorkoutDayUseCase.execute({
			userId: request.user.id,
			workoutPlanId: request.params.workoutPlanId,
			workoutDayId: request.params.workoutDayId,
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
