const request = require('supertest');
const { ValidationError } = require('yup');
const { v4 } = require('uuid');
const app = require('../server');
const {
  saveSites, getSites, getSiteByID, getEmployers, getEmployerByID,
  updateSite,
} = require('../services/employers.js');
const {
  getParticipants,
  makeParticipant,
  setParticipantStatus,
} = require('../services/participants.js');

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

  const site = {
    siteId: 67,
    siteName: 'Test site',
    phaseOneAllocation: 1,
    address: '123 XYZ',
    city: 'Victoria',
    healthAuthority: 'Vancouver Island',
    postalCode: 'V8V 1M5',
    registeredBusinessName: 'AAA',
    operatorName: 'Test Operator',
    operatorContactFirstName: 'AABB',
    operatorContactLastName: 'CCC',
    operatorEmail: 'test@hcpa.fresh',
    operatorPhone: '2219909090',
    siteContactFirstName: 'NNN',
    siteContactLastName: 'PCP',
    siteContactPhoneNumber: '2219909091',
    siteContactEmailAddress: 'test.site@hcpa.fresh',
  };

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

  it('Create new site, receive success', async () => {
    const res = await saveSites(site);
    const expectedRes = [
      { siteId: 67, status: 'Success' },
    ];
    expect(res).toEqual(expectedRes);
  });

  it('Get sites, receive all successfully', async () => {
    const res = await getSites();
    expect(res).toEqual(
      expect.arrayContaining(
        [site].map((item) => (expect.objectContaining(item))),
      ),
    );
  });

  it('Gets a single site', async () => {
    const res = await getSiteByID(1);
    expect(res).toEqual(
      expect.arrayContaining(
        [site].map((item) => (expect.objectContaining(item))),
      ),
    );
  });

  it('gets a site before and after hires have been made', async () => {
    const employerAId = v4();
    const employerBId = v4();
    const participant1 = {
      maximusId: 648690,
      lastName: 'Extra',
      firstName: 'Eddy',
      postalCode: 'V1V2V3',
      postalCodeFsa: 'V1V',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
    };

    const [res] = await getSiteByID(1);
    expect(res.hcapHires).toEqual('0');
    expect(res.nonHcapHires).toEqual('0');
    await makeParticipant(participant1);
    const { data: [ppt] } = await getParticipants({ isMoH: true });
    console.log('ppt');
    console.log(ppt);
    await setParticipantStatus(employerAId, ppt.id, 'hired', {
      site: 1,
      nonHcapOpportunity: false,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    await setParticipantStatus(employerBId, ppt.id, 'hired', {
      site: 1,
      nonHcapOpportunity: true,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    const [res1] = await getSiteByID(1);
    expect(res1.hcapHires).toEqual('1');
    expect(res1.nonHcapHires).toEqual('1');
  });

  it('Create new site, receive validation error', async () => {
    expect(
      saveSites({ ...site, siteContactPhoneNumber: '1' }),
    ).rejects.toEqual(new ValidationError('Phone number must be provided as 10 digits (index 0)'));
  });

  it('Create new site, receive duplicated', async () => {
    const res = await saveSites(site);
    const expectedRes = [
      { siteId: 67, status: 'Duplicate' },
    ];
    expect(res).toEqual(expectedRes);
  });

  it('Update site, receive success', async () => {
    const res = await updateSite(1, {
      siteName: 'test',
      history: [{ timestamp: new Date(), changes: [{ field: 'siteName', from: 'test1', to: 'test' }] }],
    });
    expect(res[0].siteName).toEqual('test');
  });

  it('fetches the list of employers', async () => {
    const res = await getEmployers({
      isSuperUser: false, isMoH: false, isHA: true, regions: ['Vancouver Island'],
    });
    expect(res).toEqual([]);
  });

  it('fetches a single employer', async () => {
    const res = await getEmployerByID(1);
    expect(res).toEqual(
      expect.arrayContaining(
        [form].map((item) => (expect.objectContaining(item))),
      ),
    );
  });
});
