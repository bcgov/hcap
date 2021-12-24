/**
 * Tests for route /api/v1/participant-user/*
 * Test Standalone execution: npm run test:debug participant.landing.e2e.test
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, participant } = require('./util/keycloak');

describe('Participant landing e2e', () => {
  let server;
  const form = {
    eligibility: true,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '1234567890',
    emailAddress: 'cristiano.ronaldo@hcap.club',
    postalCode: 'V1V 1V1',
    preferredLocation: ['Fraser'],
    reasonForFindingOut: ['Friend(s)'],
    consent: true,
  };
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });
  // TODO: Re-add these tests when a participant user is added to keycloak in the pipeline
  it('should participants - success', async () => {
    const header = await getKeycloakToken(participant);
    const res = await request(app).get('/api/v1/participant-user/participants').set(header);
    expect(res.status).toEqual(200);
  });
  it('should get participant data with success', async () => {
    const header = await getKeycloakToken(participant);
    await request.agent(app).post('/api/v1/participants').send(form);
    const res = await request(app).get('/api/v1/participant-user/participants').set(header);
    expect(res.body.length).toBeGreaterThan(0);
  });
  it('should withdraw a participant', async () => {
    const header = await getKeycloakToken(participant);
    const res = await request(app).post('/api/v1/participant-user/withdraw').set(header);
    expect(res.status).toEqual(204);
  });
  it('should withdraw a participant with verification', async () => {
    const header = await getKeycloakToken(participant);
    const res = await request(app).get('/api/v1/participant-user/participants').set(header);
    expect(res.body[0].interested).toEqual('withdrawn');
  });
});
