import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GetStatsQuery } from '@/controllers/stats/schemas';
import { makeGetStatsUseCase } from '@/use-cases/factories/make-get-stats-use-case';

export const getStats = async (
	request: FastifyRequest<{ Querystring: GetStatsQuery }>,
	reply: FastifyReply,
) => {
	const getStatsUseCase = makeGetStatsUseCase();

	const result = await getStatsUseCase.execute({
		userId: request.user.id,
		from: request.query.from,
		to: request.query.to,
	});

	return reply.status(200).send(result);
};
