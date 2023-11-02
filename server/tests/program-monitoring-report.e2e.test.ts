import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, ministryOfHealth } from './util/keycloak';

describe('api-e2e test for route /api/v1/program-monitoring-report', () => {
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
    const res = await request(app)
      .get('/api/v1/program-monitoring-report/csv/monitoring')
      .set(header);
    expect(res.status).toEqual(200);
  });
});
