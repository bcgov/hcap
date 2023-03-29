// Test execution code: npm run test:debug participant.e2e.test.js
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import { getKeycloakToken, healthAuthority, ministryOfHealth, employer } from './util/keycloak';

describe('e2e tests for /participant route', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await server.close();
    await closeDB();
  });

  it('should return participants for MoH', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app).get(`/api/v1/participants`).set(header);

    expect(res.status).toEqual(200);
  });

  it('should return participants for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/participants`).set(header);

    expect(res.status).toEqual(200);
  });

  it('should return participants for employer', async () => {
    const header = await getKeycloakToken(employer);
    const res = await request(app).get(`/api/v1/participants`).set(header);

    expect(res.status).toEqual(200);
  });
});
