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

  it('should create participant status with bulk engage', async () => {
    // Test Data
    const participant1 = await makeTestParticipant({
      emailAddress: 'employer.action.e2e.21@hcap.io',
    });
    const participant2 = await makeTestParticipant({
      emailAddress: 'employer.action.e2e.22@hcap.io',
    });
    const site1 = await makeTestSite({
      siteId: 202204262056,
      siteName: 'Test Site e2e 021',
      city: 'Test City e2e 021',
    });
    const site2 = await makeTestSite({
      siteId: 202204262057,
      siteName: 'Test Site e2e 022',
      city: 'Test City e2e 022',
    });
    const header = await getKeycloakToken(employer);
    const res = await request(app)
      .post(`/api/v1/employer-actions/bulk-engage`)
      .set(header)
      .send({
        participants: [participant1.id, participant2.id],
        sites: [site1, site2],
      });
    expect(res.statusCode).toBe(201);
  });
});
