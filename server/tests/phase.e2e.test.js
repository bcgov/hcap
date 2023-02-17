/**
 * Tests for route /api/v1/phase
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, ministryOfHealth, healthAuthority } = require('./util/keycloak');
const { siteData } = require('./util/testData');
const { makeTestSite } = require('./util/integrationTestData');

describe('api e2e tests for /phase', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should allow MOH to create phase', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test Phase name',
        start_date: '2023/10/12',
        end_date: '2025/10/12',
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should not allow HA to create phase', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .patch(`/api/v1/phase/1`)
      .send({
        start_date: '2024/10/12',
        end_date: '2027/10/12',
      })
      .set(header);
    expect(res.status).toEqual(403);
  });

  it('should validate that end date is after start date - return error', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test Phase name',
        start_date: '2023/10/12',
        end_date: '2020/10/12',
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should allow MOH to edit an existing phase', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/phase/1`)
      .send({
        start_date: '2024/10/12',
        end_date: '2027/10/12',
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should not allow HA to edit an existing phase', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .patch(`/api/v1/phase/1`)
      .send({
        start_date: '2024/10/12',
        end_date: '2027/10/12',
      })
      .set(header);
    expect(res.status).toEqual(403);
  });

  it('should return phases', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/phase`).set(header);
    expect(res.status).toEqual(200);
  });

  it('should return all phases with allocations', async () => {
    const siteMock = siteData({
      siteId: 7,
      siteName: 'Test phase',
      operatorEmail: 'test.e2e.phase@hcap.io',
    });
    const site = await makeTestSite(siteMock);
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/phase/${site.id}`).set(header);
    expect(res.status).toEqual(200);
  });
});
