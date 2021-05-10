/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { readFileSync } = require('fs');
const { join } = require('path');
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, superuser, employer } = require('./util/keycloak');

describe('Participants Endpoint', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

  const expectedRes = [
    { id: 6488690, status: 'Success' },
    { id: 6488691, status: 'Success' },
    { id: 6488692, status: 'Success' },
    { id: 6488693, status: 'Success' },
    { id: 6488694, status: 'Success' },
    { id: 6488695, status: 'Success' },
    { id: 6488696, status: 'Success' },
    { id: 6488697, status: 'Success' },
    { id: 6488698, status: 'Success' },
    { id: 6488699, status: 'Success' },
  ];

  const participantsXlsx = readFileSync(join(__dirname, './mock/xlsx/participants-data.xlsx'));

  it('Upload participants xlsx as superuser, receive success', async () => {
    const res = await request
      .agent(app)
      .post('/api/v1/participants/batch')
      .set(await getKeycloakToken(superuser))
      .attach('file', participantsXlsx, 'participants-data.xlsx');
    expect(res.status).toEqual(201);
    expect(res.body).toEqual(expectedRes);
  });

  it('Upload participants xlsx as employer, receive forbidden', async () => {
    const res = await request
      .agent(app)
      .post('/api/v1/participants/batch')
      .set(await getKeycloakToken(employer))
      .attach('file', participantsXlsx, 'participants-data.xlsx');
    expect(res.status).toEqual(403);
  });
});
