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
      .post(`/api/v1/cohorts/assigned-participant/${participant.id}`)
      .set(header);
    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(cohort.id);
  });
});
