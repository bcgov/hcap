/**
 * Tests for route /api/v1/user-details
 * Test Standalone execution: npm run test:debug user-details.e2e.test
 */
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import { getKeycloakToken, superuser } from './util/keycloak';

describe('api-e2e tests for /api/v1/user-details', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should not get user details but error 400', async () => {
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get('/api/v1/user-details').set(header);
    expect(res.status).toEqual(400);
  });

  it('should not update user but get error 400', async () => {
    const header = await getKeycloakToken(superuser);
    const res = await request(app).patch('/api/v1/user-details').set(header).send({});
    expect(res.status).toEqual(400);
  });
});
