/**
 * Tests for route /api/v1/cohorts
 * Test Standalone execution: npm run test:debug cohorts.e2e.test
 */
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, employer } from './util/keycloak';

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
  //
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

  it('should assign cohort to participant', async () => {
    const { participant, cohort } = await dataSetup();
    const header = await getKeycloakToken(employer);
    const res = await request(app)
      .post(`/api/v1/cohorts/${cohort.id}/assign/${participant.id}`)
      .set(header);
    expect(res.status).toEqual(201);
  });

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

  it('should update cohort', async () => {
    const { cohort } = await setupCohort({
      instituteName: 'Test Update Cohort Inst. - 1',
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
      instituteName: 'Test Update Cohort Inst. - 2',
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
