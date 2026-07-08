import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
	UpdateWorkoutSessionBody,
	UpdateWorkoutSessionParams,
} from '@/controllers/workout-plans/schemas';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { makeUpdateWorkoutSessionUseCase } from '@/use-cases/factories/make-update-workout-session-use-case';

export const updateWorkoutSession = async (
	request: FastifyRequest<{ Params: UpdateWorkoutSessionParams; Body: UpdateWorkoutSessionBody }>,
	reply: FastifyReply,
) => {
	try {
		const updateWorkoutSessionUseCase = makeUpdateWorkoutSessionUseCase();

		const result = await updateWorkoutSessionUseCase.execute({
			userId: request.user.id,
			workoutPlanId: request.params.workoutPlanId,
			workoutDayId: request.params.workoutDayId,
			workoutSessionId: request.params.workoutSessionId,
			completedAt: request.body.completedAt,
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
