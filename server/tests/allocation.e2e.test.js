/* eslint-disable */
/**
 * Tests for route /api/v1/allocation
 */
const request = require('supertest');
const app = require('../server');
const { v4 } = require('uuid');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, ministryOfHealth } = require('./util/keycloak');
const { saveSingleSite } = require('../services/employers');
// const {
//   getPhaseAllocation,
//   createPhaseAllocation,
//   updatePhaseAllocation,
// } = require('../services/allocations');
const { createGlobalPhase } = require('../services/phase');
const { siteData } = require('./util/testData');
const { makeTestSite } = require('./util/integrationTestData');

const phaseData = {
  phaseName: 'Test Phase',
  startDate: new Date(),
  endDate: new Date(),
};

const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

const site1 = makeTestSite({
  siteId: 202205252325,
  siteName: 'Test Site 1040',
  city: 'Test City 1040',
});

const moh = {
  id: v4(),
  isEmployer: true,
  regions,
  sites: [site1.siteId],
};

const dataSetup = async () => {
  const site = makeTestSite({
    siteId: 202205252325,
    siteName: 'Test Site 1040',
    city: 'Test City 1040',
    id: 1,
  });
  expect(site.id).toBeDefined();
  const phase = await createGlobalPhase(phaseData);
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
    const { site, phase } = await dataSetup();
    const header = await getKeycloakToken(ministryOfHealth);
    console.log(header);
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
});
