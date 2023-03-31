/**
 * Tests for route /api/v1/psi/:psiId/cohorts
 * Test Standalone execution: npm run test:debug cohorts.e2e.test
 */
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, healthAuthority, ministryOfHealth } from './util/keycloak';

import { makePSI } from '../services/post-secondary-institutes';
import { makeCohort } from '../services/cohorts';
import { psiData, cohortData } from './util/testData';

const dataSetup = async ({
  instituteName = 'Test Fresh Inst.',
  cohortName = 'Batch 1',
  cohortSize = 2,
} = {}) => {
  const psi = await makePSI(psiData({ instituteName, regionIndex: 1 }));
  expect(psi.id).toBeDefined();
  const cohort = await makeCohort(cohortData({ cohortName, cohortSize, psiID: psi.id }));
  expect(cohort.id).toBeDefined();

  return {
    cohort,
    psi,
  };
};

const dateStr = (date = new Date()) => date.toISOString().split('T')[0].replace(/-/gi, '/');
describe('api e2e tests for /cohorts', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  describe('POST /psi/:psiId/cohorts', () => {
    it('should create cohort for HA', async () => {
      const psi = await makePSI(
        psiData({ instituteName: 'Testing again cohorts', regionIndex: 1 })
      );
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app)
        .post(`/api/v1/psi/${psi.id}/cohorts`)
        .send({
          cohortName: 'Mock Cohort',
          cohortSize: 100,
          startDate: dateStr(new Date()),
          endDate: dateStr(new Date()),
          psiID: psi.id,
        })
        .set(header);
      expect(res.status).toEqual(201);
      expect(res.body.cohort_name).toEqual('Mock Cohort');
      expect(res.body.cohort_size).toEqual(100);
    });
  });

  describe('GET /psi/:psiId/cohorts', () => {
    it('should get cohorts for PSI status as HA', async () => {
      const psi = await makePSI(
        psiData({ instituteName: 'Testing third cohorts', regionIndex: 1 })
      );
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app).get(`/api/v1/psi/${psi.id}/cohorts/`).set(header);
      expect(res.status).toEqual(200);
    });
  });

  describe('GET /psi/:psiId/cohorts/:cohortId', () => {
    it('should get cohort by Id for PSI status as MOH', async () => {
      const { psi, cohort } = await dataSetup();
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app).get(`/api/v1/psi/${psi.id}/cohorts/${cohort.id}`).set(header);
      expect(res.status).toEqual(200);
    });
  });
});
