/**
 * Tests for route /api/v1/cohorts
 * Test Standalone execution: npm run test:debug cohorts.e2e.test
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, employer } = require('./util/keycloak');
const { makePSI } = require('../services/post-secondary-institutes');
const { makeCohort, assignCohort } = require('../services/cohorts');
const { makeParticipant } = require('../services/participants');
const { participantData, psiData, cohortData } = require('./util/testData');
const { makeTestParticipant } = require('./util/integrationTestData');

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
