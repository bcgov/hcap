const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, participant } = require('./util/keycloak');

describe('Participant landing e2e', async () => {
  let server;
  const form = {
    eligibility: true,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '1234567890',
    emailAddress: 'test-participant@test.com',
    postalCode: 'V1V 1V1',
    preferredLocation: ['Fraser'],
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
  it.skip('Get participants request is successful ', async () => {
    const header = await getKeycloakToken(participant);
    const res = await request(app).get('/api/v1/participant-user/participants').set(header);
    expect(res.status).toEqual(200);
  });
  it.skip('Get participants request is successful ', async () => {
    const header = await getKeycloakToken(participant);
    await request.agent(app).post('/api/v1/participants').send(form);
    const res = await request(app).get('/api/v1/participant-user/participants').set(header);
    expect(res.body.length).toEqual(1);
  });
  it.skip('Withdraw a participant should succeed', async () => {
    const header = await getKeycloakToken(participant);
    const res = await request(app).post('/api/v1/participant-user/withdraw').set(header);
    expect(res.status).toEqual(204);
  });
  it.skip('Withdraw a participant should succeed', async () => {
    const header = await getKeycloakToken(participant);
    const res = await request(app).get('/api/v1/participant-user/participants').set(header);
    expect(res.body[0].interested).toEqual('withdrawn');
  });
});
