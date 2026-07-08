import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '@/generated/prisma/client';
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-users-repository';
import { GetUserTrainDataUseCase } from '@/use-cases/get-user-train-data';

let usersRepository: InMemoryUsersRepository;
let sut: GetUserTrainDataUseCase;

const buildUser = (overrides: Partial<User> = {}): User => ({
	id: 'user-1',
	name: 'John Doe',
	email: 'john@example.com',
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	weightInGrams: 70000,
	heightInCentimeters: 175,
	age: 30,
	bodyFatPercentage: 20,
	...overrides,
});

describe('Get User Train Data Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new GetUserTrainDataUseCase(usersRepository);
	});

	it('should return the train data of the user', async () => {
		usersRepository.items.push(buildUser());

		const result = await sut.execute({ userId: 'user-1' });

		expect(result).toEqual({
			userId: 'user-1',
			userName: 'John Doe',
			weightInGrams: 70000,
			heightInCentimeters: 175,
			age: 30,
			bodyFatPercentage: 20,
		});
	});

	it('should return null when the user does not exist', async () => {
		const result = await sut.execute({ userId: 'non-existing-id' });

		expect(result).toBeNull();
	});

	it('should return null when any train data field is missing', async () => {
		usersRepository.items.push(buildUser({ weightInGrams: null }));

		const result = await sut.execute({ userId: 'user-1' });

		expect(result).toBeNull();
	});
});
