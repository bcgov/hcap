// Test execution code: npm run test:debug participant-details.e2e.test.js
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import { makeTestParticipant, createTestParticipantStatus } from './util/integrationTestData';
import { approveUsers, getKeycloakToken, healthAuthority, ministryOfHealth } from './util/keycloak';

describe('e2e tests for /participant/details route', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
    await approveUsers(ministryOfHealth, healthAuthority);
  });

  afterAll(async () => {
    await server.close();
    await closeDB();
  });

  it('should return participant for MoH', async () => {
    const p = await makeTestParticipant({ emailAddress: 'test.e2e.participant.details.1@hcap.io' });
    expect(p.id).toBeDefined();

    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app).get(`/api/v1/participant/details/${p.id}`).set(header);

    expect(res.status).toEqual(200);
  });

  it('should not return participant for MoH if participant.id does not exist', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app).get(`/api/v1/participant/details/574857`).set(header);

    expect(res.status).toEqual(404);
  });

  it('should not return participant for HA if participant is not in the same region', async () => {
    const { participant } = await createTestParticipantStatus({
      participantData: { emailAddress: 'test.e2e.participant.details.2@hcap.io' },
      employerId: 2,
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
      employerId: 2,
      siteData: { siteId: 1232, healthAuthority: 'Fraser' },
      status: 'hired',
    });
    expect(participant.id).toBeDefined();

    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/participant/details/${participant.id}`).set(header);
    expect(res.status).toEqual(200);
  });
});
