/**
 * Tests for route /api/v1/psi
 * Test Standalone execution: npm run test:debug psi.e2e.test
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, superuser } = require('./util/keycloak');
const { makePSI } = require('../services/post-secondary-institutes');
const { makeCohort } = require('../services/cohorts');

const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

const psi = ({ instituteName, regionIndex, address, postalCode, city }) => ({
  instituteName,
  healthAuthority: regions[regionIndex || 0],
  streetAddress: address || '1815 Blanshard St',
  postalCode: postalCode || 'V2V 3V4',
  city: city || 'Victoria',
});

const today = new Date();

const after = (months, input = today) => new Date(input.setMonth(input.getMonth() + months));

const dateStr = (date = new Date()) => date.toISOString().split('T')[0].replace(/-/gi, '/');

const cohort = ({ cohortName, startDate, endDate, cohortSize, psiID }) => ({
  cohortName,
  startDate: dateStr(startDate),
  endDate: dateStr(endDate || after(6)),
  cohortSize: cohortSize || 1,
  psiID,
});

describe('api-e2e tests for for /psi routes', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should return all psi with cohorts', async () => {
    const psiData = psi({ instituteName: 'Test Institute' });
    const savedPsi = await makePSI(psiData);
    expect(savedPsi.id).toBeDefined();
    const cohortData = cohort({ cohortName: 'Test Cohort', psiID: savedPsi.id });
    const savedCohort = await makeCohort(cohortData);
    expect(savedCohort.id).toBeDefined();
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get(`/api/v1/psi/with-cohorts`).set(header);
    expect(res.status).toEqual(200);
    const results = res.body || [];
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.cohorts).toBeDefined();
  });
});
