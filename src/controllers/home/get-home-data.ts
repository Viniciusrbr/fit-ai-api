import type { FastifyReply, FastifyRequest } from 'fastify';
import type { HomeParams } from '@/controllers/home/schemas';
import { makeGetHomeDataUseCase } from '@/use-cases/factories/make-get-home-data-use-case';

export const getHomeData = async (
	request: FastifyRequest<{ Params: HomeParams }>,
	reply: FastifyReply,
) => {
	const getHomeDataUseCase = makeGetHomeDataUseCase();

	const result = await getHomeDataUseCase.execute({
		userId: request.user.id,
		date: request.params.date,
	});

	return reply.status(200).send(result);
};
