/* eslint-disable no-restricted-syntax, no-await-in-loop */
// Test: npm run test:debug participant.test.js
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB, cleanDB } from './util/db';
import { getKeycloakToken, superuser } from './util/keycloak';

describe('Participants Endpoint', () => {
  // @TODO add seed data and test proper results
  let server;
  const RealDate = Date;
  const DATE_TO_USE = new Date('2021');

  beforeEach(async () => {
    await cleanDB();
    const mockDate = Date;
    // @ts-ignore NOTE: should find a TS-friendly way of doing this
    global.Date = jest.fn(() => DATE_TO_USE);
    global.Date.UTC = mockDate.UTC;
    global.Date.parse = mockDate.parse;
    global.Date.now = mockDate.now;
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

  it('Creates a participant', async () => {
    const newParticipant = {
      eligibility: true,
      firstName: 'first_name',
      lastName: 'last_name',
      phoneNumber: '1234561231',
      emailAddress: 'test@test.com',
      postalCode: 'A3A3A3',
      preferredLocation: ['Fraser'],
      reasonForFindingOut: ['Friend(s)'],
      consent: true,
    };
    const expectedRes = {
      ...newParticipant,
      preferredLocation: 'Fraser',
      nonHCAP: null,
      crcClear: null,
      maximusId: null,
      interested: 'yes',
      formVersion: 'v2',
      postalCodeFsa: 'A3A',
      userUpdatedAt: new Date(),
      callbackStatus: false,
      id: 1,
      created_at: new Date(),
      updated_at: null,
    };
    const res = await request
      .agent(app)
      .post(`/api/v1/participants`)
      .send(newParticipant)
      .set(await getKeycloakToken(superuser));

    expect(res.status).toEqual(201);
    expect(res.body).toEqual({
      ...expectedRes,
      userUpdatedAt: new Date(expectedRes.userUpdatedAt).toISOString(),
      created_at: new Date(expectedRes.created_at).toISOString(),
    });
  });

  it('Receives a list of participants', async () => {
    const res = await request
      .agent(app)
      .get(`/api/v1/participants`)
      .set(await getKeycloakToken(superuser));
    const expectedRes = { data: [], pagination: { offset: 0, total: 0 } };
    expect(res.status).toEqual(200);
    expect(res.body).toEqual(expectedRes);
  });

  it("Receives empty array when user isn't found", async () => {
    const res = await request
      .agent(app)
      .get(`/api/v1/participant?id=123`)
      .set(await getKeycloakToken(superuser));
    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);
  });
});
