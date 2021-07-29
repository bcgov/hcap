/**
 * Tests for route /api/v1/milestone-report
 * Test Standalone execution: npm run test:debug milestone-report.e2e.test
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, superuser } = require('./util/keycloak');

describe('api-e2e test for route /api/v1/milestone-report', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should get report', async () => {
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get('/api/v1/milestone-report').set(header);
    expect(res.status).toEqual(200);
    expect(res.body?.data).toBeDefined();
  });

  it('should get hired report', async () => {
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get('/api/v1/milestone-report/csv/hired').set(header);
    expect(res.status).toEqual(200);
  });
});
