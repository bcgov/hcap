/**
 * Tests for route /api/v1/psi-report
 * Test Standalone execution: npm run test:debug psi-report.e2e.test
 */
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, ministryOfHealth, healthAuthority, employer } from './util/keycloak';

describe('api-e2e test for route /api/v1/psi-report', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should get report for MOH', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app).get('/api/v1/psi-report/csv/participants').set(header);
    expect(res.status).toEqual(200);
  });

  it('should get report for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/psi-report/csv/participants').set(header);
    expect(res.status).toEqual(200);
  });

  it('should fail get report for employer', async () => {
    const header = await getKeycloakToken(employer);
    const res = await request(app).get('/api/v1/psi-report/csv/participants').set(header);
    expect(res.status).toEqual(403);
  });
});
