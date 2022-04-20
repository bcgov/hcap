// Test Code: npm run test:debug employer-action.e2e.test.js
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, employer } = require('./util/keycloak');
const { makeTestParticipant, makeTestSite } = require('./util/integrationTestData');

describe('Test api/v1/employer-actions', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should create participant status', async () => {
    // Participant
    const participant = await makeTestParticipant({
      emailAddress: 'employer.action.e2e.1@hcap.io',
    });
    const site = await makeTestSite({
      siteId: 202204201210,
      siteName: 'Test Site e2e 01',
      city: 'Test City e2e 01',
    });

    const header = await getKeycloakToken(employer);
    const res = await request(app)
      .post(`/api/v1/employer-actions`)
      .set(header)
      .send({
        participantId: participant.id,
        status: 'prospecting',
        data: {},
        sites: [site],
      });
    expect(res.statusCode).toBe(201);
  });
});
