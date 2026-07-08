import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '@/generated/prisma/client';
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-users-repository';
import { UpsertUserTrainDataUseCase } from '@/use-cases/upsert-user-train-data';

let usersRepository: InMemoryUsersRepository;
let sut: UpsertUserTrainDataUseCase;

const buildUser = (overrides: Partial<User> = {}): User => ({
	id: 'user-1',
	name: 'John Doe',
	email: 'john@example.com',
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	weightInGrams: null,
	heightInCentimeters: null,
	age: null,
	bodyFatPercentage: null,
	...overrides,
});

describe('Upsert User Train Data Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new UpsertUserTrainDataUseCase(usersRepository);
	});

	it('should save the train data of the user', async () => {
		usersRepository.items.push(buildUser());

		const result = await sut.execute({
			userId: 'user-1',
			weightInGrams: 70000,
			heightInCentimeters: 175,
			age: 30,
			bodyFatPercentage: 20,
		});

		expect(result).toEqual({
			userId: 'user-1',
			weightInGrams: 70000,
			heightInCentimeters: 175,
			age: 30,
			bodyFatPercentage: 20,
		});
		expect(usersRepository.items[0].weightInGrams).toBe(70000);
	});

	it('should overwrite previously saved train data', async () => {
		usersRepository.items.push(
			buildUser({ weightInGrams: 80000, heightInCentimeters: 180, age: 25, bodyFatPercentage: 25 }),
		);

		const result = await sut.execute({
			userId: 'user-1',
			weightInGrams: 70000,
			heightInCentimeters: 175,
			age: 30,
			bodyFatPercentage: 20,
		});

		expect(result.weightInGrams).toBe(70000);
		expect(usersRepository.items[0].age).toBe(30);
	});
});
