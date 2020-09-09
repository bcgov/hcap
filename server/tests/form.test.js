const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');

describe('Server V1 Form Endpoints', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
  });

  const formEndpoint = '/api/v1/form';

  const form = {
    eligibility: true,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '1234567890',
    emailAddress: 'a@b.c',
    postalCode: 'V1V 1V1',
    preferredLocation: ['Fraser'],
    consent: true,
  };

  it('Create new form, receive 200', async () => {
    const res = await request.agent(app)
      .post(formEndpoint)
      .send(form);
    expect(res.statusCode).toEqual(200);
  });

  it('Create new form using an invalid field, receive 400', async () => {
    const res = await request.agent(app)
      .post(formEndpoint)
      .send({ ...form, nonExistentField: '1' });
    expect(res.statusCode).toEqual(400);
  });

  it('Create new empty form, receive 400', async () => {
    const res = await request.agent(app)
      .post(formEndpoint)
      .send({ });
    expect(res.statusCode).toEqual(400);
  });

  it('Create new form that fails validation, receive 400', async () => {
    const res = await request.agent(app)
      .post(formEndpoint)
      .send({ ...form, consent: false });
    expect(res.statusCode).toEqual(400);
  });

  afterAll(() => {
    server.close();
  });
});
