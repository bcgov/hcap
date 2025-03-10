/**
 * Tests for route /api/v1/psi
 * Test Standalone execution: npm run test:debug psi.e2e.test
 */
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import { getKeycloakToken, superuser, ministryOfHealth, healthAuthority } from './util/keycloak';
import { makePSI } from '../services/post-secondary-institutes';
import { makeCohort } from '../services/cohorts';
import { makeTestPSI } from './util/integrationTestData';

interface PsiArgs {
  instituteName: string;
  regionIndex?: number;
  address?: string;
  postalCode?: string;
  city?: string;
}

interface CohortArgs {
  cohortName: string;
  startDate?: Date;
  endDate?: Date;
  cohortSize?: number;
  psiID;
}

const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

const psi = ({ instituteName, regionIndex, address, postalCode, city }: PsiArgs) => ({
  instituteName,
  healthAuthority: regions[regionIndex || 0],
  streetAddress: address || '1815 Blanshard St',
  postalCode: postalCode || 'V2V 3V4',
  city: city || 'Victoria',
});

const today = new Date();

const after = (months, input = today) => new Date(input.setMonth(input.getMonth() + months));

const dateStr = (date = new Date()) => date.toISOString().split('T')[0].replace(/-/gi, '/');

const cohort = ({ cohortName, startDate, endDate, cohortSize, psiID }: CohortArgs) => ({
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

  describe('POST /', () => {
    it('should create psi for MOH', async () => {
      const payload = {
        instituteName: 'Test PSI',
        healthAuthority: 'Fraser',
        streetAddress: '111 test street ',
        postalCode: 'V1V 2X4',
      };
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app).post('/api/v1/psi').set(header).send(payload);
      expect(res.status).toEqual(201);
    });

    it('should create psi for HA', async () => {
      const payload = {
        instituteName: 'Another Test PSI',
        healthAuthority: 'Fraser',
        streetAddress: '111 test street ',
        postalCode: 'V1V 2X4',
      };
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app).post('/api/v1/psi').set(header).send(payload);
      expect(res.status).toEqual(201);
    });
  });

  describe('GET /with-cohorts - Get all PSI with cohorts', () => {
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

  describe('GET /:id', () => {
    it('should return PSI by id', async () => {
      const psiData = psi({ instituteName: 'Test Get by ID' });
      const savedPsi = await makePSI(psiData);
      expect(savedPsi.id).toBeDefined();
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app).get(`/api/v1/psi/${savedPsi.id}`).set(header);
      expect(res.status).toEqual(200);
    });

    it('should fail to return PSI - invalid ID', async () => {
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app).get('/api/v1/psi/544').set(header);
      expect(res.status).toEqual(401);
    });
  });

  describe('PUT /:id', () => {
    it('should update psi', async () => {
      const psiDbObj = await makeTestPSI(psi({ instituteName: 'Test Institute 202206290756' }));
      const { id, ...rest } = psiDbObj;
      const updateObj = {
        instituteName: rest.institute_name,
        healthAuthority: rest.health_authority,
        streetAddress: rest.street_address,
        postalCode: rest.postal_code,
      };
      const header = await getKeycloakToken(superuser);
      const resSuccess = await request(app)
        .put(`/api/v1/psi/${id}`)
        .set(header)
        .send({ ...updateObj, streetAddress: '1815 Mac St' });
      expect(resSuccess.status).toEqual(200);

      const resFail = await request(app)
        .put(`/api/v1/psi/${id}`)
        .set(header)
        .send({ ...updateObj, instituteName: 'Test Institute' });
      expect(resFail.status).toEqual(409);
    });
  });
});
