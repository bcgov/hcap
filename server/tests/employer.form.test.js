const request = require('supertest');
const { v4 } = require('uuid');
const app = require('../server');
const {
  getEmployers,
  getEmployerByID,
  getSites,
  getSiteByID,
  saveSites,
} = require('../services/employers.js');

const {
  getParticipants,
  getHiredParticipantsBySite,
  setParticipantStatus,
  makeParticipant,
} = require('../services/participants.js');

const { startDB, closeDB, cleanDB } = require('./util/db');

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

  const participant2 = {
    maximusId: 648691,
    lastName: 'Finkleman',
    firstName: 'Freduardo',
    postalCode: 'V1V2V3',
    postalCodeFsa: 'V1V',
    phoneNumber: '2502223333',
    emailAddress: 'freddy@example.com',
    interested: 'yes',
    nonHCAP: 'yes',
    crcClear: 'yes',
    preferredLocation: 'Fraser',
  };

  const site = {
    siteId: 67,
    siteName: 'Test site',
    allocation: 1,
    address: '123 XYZ',
    city: 'Victoria',
    healthAuthority: 'Vancouver Island',
    postalCode: 'V0A 1M5',
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
    staffingChallenges:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',

    // Certification
    doesCertify: true,
  };

  it('Create new form, receive 201', async () => {
    const res = await request.agent(app).post(formEndpoint).send(form);
    expect(res.statusCode).toEqual(201);
  });

  it('Create new form using an invalid field, receive 400', async () => {
    const res = await request
      .agent(app)
      .post(formEndpoint)
      .send({ ...form, nonExistentField: '1' });
    expect(res.statusCode).toEqual(400);
  });

  it('Create new empty form, receive 400', async () => {
    const res = await request.agent(app).post(formEndpoint).send({});
    expect(res.statusCode).toEqual(400);
  });

  it('Create new form that fails validation, receive 400', async () => {
    const res = await request
      .agent(app)
      .post(formEndpoint)
      .send({ ...form, doesCertify: false });
    expect(res.statusCode).toEqual(400);
  });

  it('fetches the list of employer expression of interest forms', async () => {
    const res = await getEmployers({
      isSuperUser: false,
      isMoH: false,
      isHA: true,
      regions: ['Vancouver Island'],
    });
    expect(res).toEqual([]);
  });

  it('fetches a single employer expression of interest form', async () => {
    const res = await getEmployerByID(1);
    expect(res).toEqual(
      expect.arrayContaining([form].map((item) => expect.objectContaining(item)))
    );
  });

  it('checks response from the site participants endpoint', async () => {
    await cleanDB();

    const [siteResponse] = await saveSites(site);
    const expectedResponse = { siteId: 67, status: 'Success' };
    expect(siteResponse).toEqual(expectedResponse);

    const sites = await getSites();
    const [siteData] = sites.filter((entry) => entry.siteId === siteResponse.siteId);

    const [res] = await getSiteByID(siteData.id);
    await makeParticipant(participant1);
    await makeParticipant(participant2);
    const {
      data: [ppt, ppt2],
    } = await getParticipants({ isMoH: true });
    await setParticipantStatus(employerAId, ppt.id, 'prospecting');
    await setParticipantStatus(employerAId, ppt.id, 'interviewing');
    await setParticipantStatus(employerAId, ppt.id, 'offer_made');
    await setParticipantStatus(employerAId, ppt.id, 'hired', {
      site: res.siteId,
      nonHcapOpportunity: false,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    await setParticipantStatus(employerBId, ppt2.id, 'prospecting');
    await setParticipantStatus(employerBId, ppt2.id, 'interviewing');
    await setParticipantStatus(employerBId, ppt2.id, 'offer_made');
    await setParticipantStatus(employerBId, ppt2.id, 'hired', {
      site: res.siteId,
      nonHcapOpportunity: true,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    const res2 = await getHiredParticipantsBySite(siteData.siteId);
    expect(res2.length).toEqual(2);
  });
});
