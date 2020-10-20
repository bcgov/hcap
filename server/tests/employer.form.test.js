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
    server.close();
  });

  const formEndpoint = '/api/v1/employer-form';

  const form = {

    // Operator Contact Information
    registeredBusinessName: 'Test Company',
    operatorName: 'John Doe',
    operatorContactFirstName: 'John',
    operatorContactLastName: 'Doe',
    operatorEmail: 'operator@email.com',
    operatorPhone: '1111111111',
    operatorAddress: '1111 Aaa St.',
    operatorPostalCode: 'A1A 1A1',

    // Site contact info
    siteName: 'Site Name',
    address: '1111 Aaa St.',
    healthAuthority: 'Interior',
    siteContactFirstName: 'John',
    siteContactLastName: 'Doe',
    phoneNumber: '2222222222',
    emailAddress: 'site@email.com',

    // Site type and size info
    siteType: 'Other',
    otherSite: 'Long-term care',
    numPublicLongTermCare: 3,
    numPrivateLongTermCare: 5,
    numPublicAssistedLiving: 1,
    numPrivateAssistedLiving: 9,

    // HCAP Request
    hcswFteNumber: 7,

    // Workforce Baseline
    workforceBaseline: [
      {
        role: 'Registered Nurse',
        currentFullTime: 3,
        currentPartTime: 1,
        currentCasual: 2,
        vacancyFullTime: 9,
        vacancyPartTime: 3,
        vacancyCasual: 2,
      },
      {
        role: 'Licensed Practical Nurse',
        currentFullTime: 3,
        currentPartTime: 1,
        currentCasual: 2,
        vacancyFullTime: 9,
        vacancyPartTime: 3,
        vacancyCasual: 2,
      },
      {
        role: 'Health Care Assistant',
        currentFullTime: 3,
        currentPartTime: 1,
        currentCasual: 2,
        vacancyFullTime: 9,
        vacancyPartTime: 3,
        vacancyCasual: 2,
      },
      {
        role: 'Food Services Worker',
        currentFullTime: 3,
        currentPartTime: 1,
        currentCasual: 2,
        vacancyFullTime: 9,
        vacancyPartTime: 3,
        vacancyCasual: 2,
      },
      {
        role: 'Housekeeping',
        currentFullTime: 3,
        currentPartTime: 1,
        currentCasual: 2,
        vacancyFullTime: 9,
        vacancyPartTime: 3,
        vacancyCasual: 2,
      },
      {
        role: 'COVID-19 IPC Response',
        currentFullTime: 3,
        currentPartTime: 1,
        currentCasual: 2,
        vacancyFullTime: 9,
        vacancyPartTime: 3,
        vacancyCasual: 2,
      },
      {
        role: 'Site Administrative Staff',
        currentFullTime: 3,
        currentPartTime: 1,
        currentCasual: 2,
        vacancyFullTime: 9,
        vacancyPartTime: 3,
        vacancyCasual: 2,
      },
    ],

    // Staffing Challenges
    staffingChallenges: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',

    // Certification
    doesCertify: true,
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
      .send({});
    expect(res.statusCode).toEqual(400);
  });

  it('Create new form that fails validation, receive 400', async () => {
    const res = await request.agent(app)
      .post(formEndpoint)
      .send({ ...form, doesCertify: false });
    expect(res.statusCode).toEqual(400);
  });
});
