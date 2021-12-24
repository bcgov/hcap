const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');

describe('Participant Expression of Interest Form Endpoints', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

  const formEndpoint = '/api/v1/participants';

  const form = {
    eligibility: true,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '1234567890',
    emailAddress: 'a@b.c',
    postalCode: 'V1V 1V1',
    preferredLocation: ['Fraser'],
    reasonForFindingOut: ['Friend(s)'],
    consent: true,
  };

  it('Create new form, receive 201', async () => {
    const res = await request.agent(app).post(formEndpoint).send(form);
    expect(res.statusCode).toEqual(201);
  });

  it('Create new form with multiple regions, receive 201', async () => {
    const res = await request
      .agent(app)
      .post(formEndpoint)
      .send({ ...form, preferredLocation: ['Fraser', 'Vancouver Coastal'] });
    expect(res.statusCode).toEqual(201);
  });

  it('Create new form with unspaced postal code, receive 201', async () => {
    const res = await request
      .agent(app)
      .post(formEndpoint)
      .send({ ...form, postalCode: 'V1V1V1' });
    expect(res.statusCode).toEqual(201);
  });

  it('Create new empty form, receive 400', async () => {
    const res = await request.agent(app).post(formEndpoint).send({});
    expect(res.statusCode).toEqual(400);
  });

  it('Create new form that fails validation, receive 400', async () => {
    const res = await request
      .agent(app)
      .post(formEndpoint)
      .send({ ...form, consent: false });
    expect(res.statusCode).toEqual(400);
  });

  it('Create new form using an invalid field, receive 400', async () => {
    const res = await request
      .agent(app)
      .post(formEndpoint)
      .send({ ...form, nonExistentField: '1' });
    expect(res.statusCode).toEqual(400);
  });
});
