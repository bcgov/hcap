// Test execution code: npm run test:debug participant-post-hire-status.e2e.test.js

const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { makeTestParticipant, makeTestPostHireStatus } = require('./util/integrationTestData');
const { getKeycloakToken, employer } = require('./util/keycloak');
const { postHireStatuses } = require('../validation');

describe('api e2e test for /post-hire-status', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should create new status', async () => {
    const p = await makeTestParticipant({ emailAddress: 'test.e2e.post.hire.create@hcap.io' });
    const testData = {
      participantId: p.id,
      status: postHireStatuses.postSecondaryEducationCompleted,
      data: {
        graduationDate: '2020/01/01',
      },
    };
    const header = await getKeycloakToken(employer);
    const res = await request(app).post('/api/v1/post-hire-status').send(testData).set(header);
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should return all post hire status for participant', async () => {
    const { participant } = await makeTestPostHireStatus({
      email: 'test.e2e.post.hire.get@hcap.io',
      status: postHireStatuses.postSecondaryEducationCompleted,
    });

    const header = await getKeycloakToken(employer);
    const res = await request(app)
      .get(`/api/v1/post-hire-status/participant/${participant.id}`)
      .set(header);
    expect(res.status).toEqual(200);
    expect(res.body).toHaveLength(1);
  });
});
