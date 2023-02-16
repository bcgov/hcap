/**
 * Tests for route /api/v1/allocation
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, ministryOfHealth, healthAuthority } = require('./util/keycloak');
const { createGlobalPhase } = require('../services/phase');
const { makeTestSite } = require('./util/integrationTestData');

const dataSetup = async (id) => {
  const site = await makeTestSite({
    siteId: id,
    siteName: 'Test Site 1040',
    city: 'Test City 1040',
  });

  const phaseData = {
    name: 'Test Phase',
    start_date: new Date(),
    end_date: new Date(),
  };
  const user = {
    id: 'noid',
  };
  expect(site.siteId).toBeDefined();
  const phase = await createGlobalPhase(phaseData, user);
  expect(phase.id).toBeDefined();
  return {
    site,
    phase,
  };
};

describe('api e2e tests for /allocation', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should set allocation to phase', async () => {
    const { site, phase } = await dataSetup(52345);
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/allocation`)
      .send({
        allocation: 50,
        phase_id: phase.id,
        site_id: site.id,
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should edit an exisiting allocation', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: 90,
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should fail to set an allocation due to max validation', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: 120,
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should fail to set an allocation due to null validation', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: null,
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should fail to set an allocation due to `noUnknown` validation', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: 30,
        startDate: new Date(),
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should fail to edit an allocation due to unauthorized user', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: 30,
        startDate: new Date(),
      })
      .set(header);
    expect(res.status).toEqual(403);
  });

  it('should fail to set an allocation due to unauthorized user', async () => {
    const { site, phase } = await dataSetup(23621346);
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .post(`/api/v1/allocation`)
      .send({
        allocation: 50,
        phase_id: phase.id,
        site_id: site.id,
      })
      .set(header);
    expect(res.status).toEqual(403);
  });
});
