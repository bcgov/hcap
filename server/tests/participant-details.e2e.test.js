// Test execution code: npm run test:debug participant-details.e2e.test.js
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { makeTestParticipant, createTestParticipantStatus } = require('./util/integrationTestData');
const { getKeycloakToken, healthAuthority, superuser } = require('./util/keycloak');

describe('e2e tests for /participant/details route', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await server.close();
    await closeDB();
  });

  it('should return participant for MoH', async () => {
    const p = await makeTestParticipant({ emailAddress: 'test.e2e.participant.details.1@hcap.io' });
    expect(p.id).toBeDefined();

    const header = await getKeycloakToken(superuser);
    const res = await request(app).get(`/api/v1/participant/details/${p.id}`).set(header);
    expect(res.status).toEqual(200);
  });

  it('should not return participant for HA if participant is not in the same region', async () => {
    const { participant } = await createTestParticipantStatus({
      participantData: { emailAddress: 'test.e2e.participant.details.2@hcap.io' },
      siteData: { siteId: 1231, healthAuthority: 'Northern' },
      status: 'hired',
    });
    expect(participant.id).toBeDefined();

    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/participant/details/${participant.id}`).set(header);
    expect(res.status).toEqual(403);
  });

  it('should return participant for HA if participant is in the same region', async () => {
    const { participant } = await createTestParticipantStatus({
      participantData: { emailAddress: 'test.e2e.participant.details.2@hcap.io' },
      siteData: { siteId: 1232, healthAuthority: 'Fraser' },
      status: 'hired',
    });
    expect(participant.id).toBeDefined();

    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/participant/details/${participant.id}`).set(header);
    expect(res.status).toEqual(200);
  });
});
