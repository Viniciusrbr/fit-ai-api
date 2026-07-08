import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/test/e2e/create-and-authenticate-user';

describe('Get User Train Data (e2e)', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return 401 when the user is not authenticated', async () => {
		const response = await request(app.server).get('/me');

		expect(response.status).toBe(401);
	});

	it('should return null when the user has no train data', async () => {
		const { cookies } = await createAndAuthenticateUser(app);

		const response = await request(app.server).get('/me').set('Cookie', cookies);

		expect(response.status).toBe(200);
		expect(response.text).toBe('null');
	});
});
