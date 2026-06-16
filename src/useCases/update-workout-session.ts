import dayjs from 'dayjs';
import { NotFoundError } from '@/errors';
import { prisma } from '@/lib/db';

interface InputDto {
	userId: string;
	workoutPlanId: string;
	workoutDayId: string;
	workoutSessionId: string;
	completedAt: string;
}

interface OutputDto {
	id: string;
	completedAt: string;
	startedAt: string;
}

export class UpdateWorkoutSession {
	async execute(dto: InputDto): Promise<OutputDto> {
		const workoutSession = await prisma.workoutSession.findFirst({
			where: {
				id: dto.workoutSessionId,
				workoutDayId: dto.workoutDayId,
				workoutDay: {
					workoutPlanId: dto.workoutPlanId,
					workoutPlan: {
						userId: dto.userId,
					},
				},
			},
		});

		if (!workoutSession) {
			throw new NotFoundError('Workout session not found');
		}

		const updatedWorkoutSession = await prisma.workoutSession.update({
			where: { id: workoutSession.id },
			data: { completedAt: dayjs(dto.completedAt).toDate() },
		});

		return {
			id: updatedWorkoutSession.id,
			completedAt: dayjs(updatedWorkoutSession.completedAt).toISOString(),
			startedAt: dayjs(updatedWorkoutSession.startedAt).toISOString(),
		};
	}
}
