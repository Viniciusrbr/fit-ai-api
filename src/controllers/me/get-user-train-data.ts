import type { FastifyReply, FastifyRequest } from 'fastify';
import { makeGetUserTrainDataUseCase } from '@/use-cases/factories/make-get-user-train-data-use-case';

export const getUserTrainData = async (request: FastifyRequest, reply: FastifyReply) => {
	const getUserTrainDataUseCase = makeGetUserTrainDataUseCase();

	const result = await getUserTrainDataUseCase.execute({
		userId: request.user.id,
	});

	return reply.status(200).send(result);
};
