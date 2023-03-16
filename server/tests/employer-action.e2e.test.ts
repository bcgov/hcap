// Test Code: npm run test:debug employer-action.e2e.test.js
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, employer, healthAuthority } from './util/keycloak';
import { makeTestParticipant, makeTestSite } from './util/integrationTestData';

describe.skip('Test api/v1/employer-actions', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should create participant status as employer', async () => {
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

  it('should create participant status as HA', async () => {
    // Participant
    const participant = await makeTestParticipant({
      emailAddress: 'HAemployer.action.e2e.1@hcap.io',
    });
    const site = await makeTestSite({
      siteId: 54353535623,
      siteName: 'Test Site e2e 01',
      city: 'Test City e2e 01',
    });

    const header = await getKeycloakToken(healthAuthority);
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

  // The API is current depricated, not being used by the FE. But employers no longer have permission to bulk engage.
  it('should fail to create participant status with bulk engage as an employer', async () => {
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
    expect(res.statusCode).toBe(403);
  });

  it('should create participant status with bulk engage as a HA', async () => {
    // Test Data
    const participant1 = await makeTestParticipant({
      emailAddress: 'HAemployer.action.e2e.21@hcap.io',
    });
    const participant2 = await makeTestParticipant({
      emailAddress: 'HAemployer.action.e2e.22@hcap.io',
    });
    const site1 = await makeTestSite({
      siteId: 52345346146,
      siteName: 'Test Site e2e 021',
      city: 'Test City e2e 021',
    });
    const site2 = await makeTestSite({
      siteId: 6345634646,
      siteName: 'Test Site e2e 022',
      city: 'Test City e2e 022',
    });
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .post(`/api/v1/employer-actions/bulk-engage`)
      .set(header)
      .send({
        participants: [participant1.id, participant2.id],
        sites: [site1, site2],
      });
    expect(res.statusCode).toBe(200);
  });
});
