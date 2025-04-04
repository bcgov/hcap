/** * Tests for route /api/v1/cohorts
 * Test Standalone execution: npm run test:debug cohorts.e2e.test
 */
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, employer, ministryOfHealth, healthAuthority } from './util/keycloak';

import { makePSI } from '../services/post-secondary-institutes';
import { makeCohort, assignCohort } from '../services/cohorts';
import { makeParticipant } from '../services/participants';
import { participantData, psiData, cohortData } from './util/testData';
import { makeTestParticipant } from './util/integrationTestData';

const dataSetup = async ({
  firstName = 'Fresh1',
  lastName = 'Test-cohort',
  emailAddress = 'test.cohort.fresh1@fw.io',
  instituteName = 'Test Fresh Inst.',
  cohortName = 'Batch 1',
  cohortSize = 2,
} = {}) => {
  const participant = await makeParticipant(
    participantData({
      firstName,
      lastName,
      emailAddress,
    })
  );
  expect(participant.id).toBeDefined();
  const psi = await makePSI(psiData({ instituteName, regionIndex: 1 }));
  expect(psi.id).toBeDefined();
  const cohort = await makeCohort(cohortData({ cohortName, cohortSize, psiID: psi.id }));
  expect(cohort.id).toBeDefined();

  return {
    participant,
    cohort,
    psi,
  };
};

const setupCohort = async ({
  instituteName = 'Test Fresh Inst. HCAP',
  cohortName = 'B1.2',
  cohortSize = 2,
}) => {
  const psi = await makePSI(psiData({ instituteName, regionIndex: 1 }));
  expect(psi.id).toBeDefined();
  const cohort = await makeCohort(cohortData({ cohortName, cohortSize, psiID: psi.id }));
  expect(cohort.id).toBeDefined();
  return { cohort, psi };
};

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

  describe('GET /:id', () => {
    it('should get cohort by id for MOH', async () => {
      const { cohort } = await setupCohort({
        instituteName: 'Cohort e2e - 1',
        cohortName: 'Cohort 1',
        cohortSize: 200,
      });
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app).get(`/api/v1/cohorts/${cohort.id}`).set(header);
      expect(res.status).toEqual(200);
      expect(res.body.cohort.id).toEqual(cohort.id);
    });

    it('should get cohort by id for HA', async () => {
      const { cohort } = await setupCohort({
        instituteName: 'Cohort e2e - 2',
        cohortName: 'Cohort 2',
        cohortSize: 100,
      });
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app).get(`/api/v1/cohorts/${cohort.id}`).set(header);
      expect(res.status).toEqual(200);
      expect(res.body.cohort.id).toEqual(cohort.id);
    });

    it('should fail to get cohort by id for employer', async () => {
      const { cohort } = await setupCohort({
        instituteName: 'Cohort e2e - 3',
        cohortName: 'Cohort 3',
        cohortSize: 200,
      });
      const header = await getKeycloakToken(employer);
      const res = await request(app).get(`/api/v1/cohorts/${cohort.id}`).set(header);
      expect(res.status).toEqual(403);
    });
  });

  describe('POST /:id/assign/:participantId', () => {
    it('should assign cohort to participant', async () => {
      const { participant, cohort } = await dataSetup();
      const header = await getKeycloakToken(employer);
      const res = await request(app)
        .post(`/api/v1/cohorts/${cohort.id}/assign/${participant.id}`)
        .set(header);
      expect(res.status).toEqual(201);
    });

    it('should fail to assign cohort to participant due to invalid cohort id', async () => {
      const participant = await makeParticipant(
        participantData({
          firstName: 'Jack',
          lastName: 'Smith',
          emailAddress: 'jack.smith@hcap.com',
        })
      );
      const header = await getKeycloakToken(employer);
      const res = await request(app)
        .post(`/api/v1/cohorts/758475/assign/${participant.id}`)
        .set(header);
      expect(res.status).toEqual(400);
    });

    it('should fail to assign cohort to participant due to invalid participant id', async () => {
      const { cohort } = await setupCohort({
        instituteName: 'Cohort e2e - 4',
        cohortName: 'Cohort 4',
        cohortSize: 20,
      });
      const header = await getKeycloakToken(employer);
      const res = await request(app).post(`/api/v1/cohorts/${cohort.id}/assign/748573`).set(header);
      expect(res.status).toEqual(400);
    });
  });

  describe('GET /assigned-participant/:id', () => {
    it('should get assigned cohort for participant', async () => {
      const { participant, cohort } = await dataSetup({
        firstName: 'Fresh2',
        emailAddress: 'test.fa@hcap.io,',
        instituteName: 'Test 2 Inst',
        cohortName: 'Batch 2',
      });
      await assignCohort({ id: cohort.id, participantId: participant.id });
      const header = await getKeycloakToken(employer);
      const res = await request(app)
        .get(`/api/v1/cohorts/assigned-participant/${participant.id}`)
        .set(header);
      expect(res.status).toEqual(200);
      expect(res.body.id).toEqual(cohort.id);
    });

    it('should fail to get assigned cohort for participant - invalid id', async () => {
      const header = await getKeycloakToken(employer);
      const res = await request(app).get(`/api/v1/cohorts/assigned-participant/68596`).set(header);
      expect(res.status).toEqual(400);
    });
  });

  describe('PATCH /:id', () => {
    it('should update cohort', async () => {
      const { cohort } = await setupCohort({
        instituteName: 'Cohort e2e - 5',
        cohortName: 'B11.1',
        cohortSize: 5,
      });
      const header = await getKeycloakToken(employer);
      const res = await request(app)
        .patch(`/api/v1/cohorts/${cohort.id}`)
        .send({
          cohortName: 'B11.20',
          cohortSize: 10,
        })
        .set(header);
      expect(res.status).toEqual(200);
      expect(res.body.cohort_name).toEqual('B11.20');
      expect(res.body.cohort_size).toEqual(10);
    });

    it('should not update cohort: updated cohort size is less than allocation', async () => {
      const { cohort } = await setupCohort({
        instituteName: 'Cohort e2e - 6',
        cohortName: 'B11.12',
        cohortSize: 3,
      });
      const p1 = await makeTestParticipant({
        emailAddress: 'test.participant.update.cohort.1@hcap.io',
      });
      // Create Allocation
      await assignCohort({ id: cohort.id, participantId: p1.id });

      const p2 = await makeTestParticipant({
        emailAddress: 'test.participant.update.cohort.2@hcap.io',
      });

      await assignCohort({ id: cohort.id, participantId: p2.id });

      const header = await getKeycloakToken(employer);
      const res = await request(app)
        .patch(`/api/v1/cohorts/${cohort.id}`)
        .send({
          cohortName: 'B11.21',
          cohortSize: 1,
        })
        .set(header);
      expect(res.status).toEqual(400);
    });
  });
});
