// Test execution code: npm run test:debug participant-post-hire-status.e2e.test.js

const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const {
  makeTestParticipant,
  makeTestPostHireStatus,
  makeCohortAssignment,
} = require('./util/integrationTestData');
const { getKeycloakToken, healthAuthority } = require('./util/keycloak');
const { postHireStatusData } = require('./util/testData');
const { postHireStatuses } = require('../validation');

describe('api e2e test for /post-hire-status', () => {
  let server;
  let testParticipantId;
  let testPSIId;
  let testCohortId;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
    const { participantId, cohortId, psiId } = await makeCohortAssignment({
      email: 'test.post.hire.status@hcap.io',
      psiName: 'Test PSI For Post Hire Status',
      cohortName: 'S22.1',
    });
    testParticipantId = participantId;
    testCohortId = cohortId;
    testPSIId = psiId;
    expect(testParticipantId).toBeTruthy();
    expect(testCohortId).toBeTruthy();
    expect(testPSIId).toBeTruthy();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should create new status', async () => {
    const p = await makeTestParticipant({ emailAddress: 'test.e2e.post.hire.create@hcap.io' });
    const { participantId, cohortId, psiId, cohortAssignmentId } = await makeCohortAssignment({
      participantId: p.id,
      psiId: testPSIId,
      cohortName: 'S22.2',
    });
    expect(participantId).toBeTruthy();
    expect(cohortId).toBeTruthy();
    expect(psiId).toBeTruthy();
    expect(cohortAssignmentId).toBeTruthy();
    const testData = {
      participantId: p.id,
      status: postHireStatuses.postSecondaryEducationCompleted,
      data: {
        graduationDate: '2020/01/01',
      },
    };
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(testData).set(header);
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should return all post hire status for participant', async () => {
    const { participant } = await makeTestPostHireStatus({
      email: 'test.e2e.post.hire.get@hcap.io',
      status: postHireStatuses.postSecondaryEducationCompleted,
    });

    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .get(`/api/v1/post-hire-status/participant/${participant.id}`)
      .set(header);
    expect(res.status).toEqual(200);
    expect(res.body).toHaveLength(1);
  });

  it('should return 422 for posting status without cohort assignment', async () => {
    const participant = await makeTestParticipant({
      emailAddress: 'test.participant.hire4@hcap.io',
    });
    const body = postHireStatusData({
      participantId: participant.id,
      status: postHireStatuses.postSecondaryEducationCompleted,
      graduationDate: '2022/02/01',
    });
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(body).set(header);
    expect(res.status).toEqual(422);
  });
});
