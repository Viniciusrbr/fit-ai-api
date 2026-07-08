import type { FastifyReply, FastifyRequest } from 'fastify';
import type { StartWorkoutSessionParams } from '@/controllers/workout-plans/schemas';
import { NotFoundError } from '@/use-cases/errors/not-found-error';
import { SessionAlreadyStartedError } from '@/use-cases/errors/session-already-started-error';
import { WorkoutPlanNotActiveError } from '@/use-cases/errors/workout-plan-not-active-error';
import { makeStartWorkoutSessionUseCase } from '@/use-cases/factories/make-start-workout-session-use-case';

export const startWorkoutSession = async (
	request: FastifyRequest<{ Params: StartWorkoutSessionParams }>,
	reply: FastifyReply,
) => {
	try {
		const startWorkoutSessionUseCase = makeStartWorkoutSessionUseCase();

		const result = await startWorkoutSessionUseCase.execute({
			userId: request.user.id,
			workoutPlanId: request.params.workoutPlanId,
			workoutDayId: request.params.workoutDayId,
		});

		return reply.status(201).send(result);
	} catch (error) {
		if (error instanceof NotFoundError) {
			return reply.status(404).send({
				error: error.message,
				code: 'NOT_FOUND_ERROR',
			});
		}

		if (error instanceof WorkoutPlanNotActiveError) {
			return reply.status(400).send({
				error: error.message,
				code: 'WORKOUT_PLAN_NOT_ACTIVE_ERROR',
			});
		}

		if (error instanceof SessionAlreadyStartedError) {
			return reply.status(409).send({
				error: error.message,
				code: 'SESSION_ALREADY_STARTED_ERROR',
			});
		}

		throw error;
	}
};
