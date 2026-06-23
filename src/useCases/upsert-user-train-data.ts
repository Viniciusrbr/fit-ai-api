import { prisma } from '@/lib/db';

interface InputDto {
	userId: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number; // 100 representa 100%
}

interface OutputDto {
	userId: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number; // 100 representa 100%
}

export class UpsertUserTrainData {
	async execute(dto: InputDto): Promise<OutputDto> {
		const user = await prisma.user.update({
			where: { id: dto.userId },
			data: {
				weightInGrams: dto.weightInGrams,
				heightInCentimeters: dto.heightInCentimeters,
				age: dto.age,
				bodyFatPercentage: dto.bodyFatPercentage,
			},
			select: {
				id: true,
				weightInGrams: true,
				heightInCentimeters: true,
				age: true,
				bodyFatPercentage: true,
			},
		});

		return {
			userId: user.id,
			weightInGrams: user.weightInGrams ?? dto.weightInGrams,
			heightInCentimeters: user.heightInCentimeters ?? dto.heightInCentimeters,
			age: user.age ?? dto.age,
			bodyFatPercentage: user.bodyFatPercentage ?? dto.bodyFatPercentage,
		};
	}
}
