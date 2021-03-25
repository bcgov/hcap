const { ValidationError } = require('yup');
const { v4 } = require('uuid');
const app = require('../server');
const {
  saveSingleSite, saveSites, getSites, getSiteByID, updateSite,
} = require('../services/employers.js');
const {
  getParticipants,
  makeParticipant,
  setParticipantStatus,
  getHiredParticipantsBySite,
} = require('../services/participants.js');

const { startDB, closeDB } = require('./util/db');

describe('Employer Site Endpoints', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

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

  // Used for single site POST
  // siteId must be assigned by the test
  const siteBaseFields = {
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
    siteContactPhone: '2219909091',
    siteContactEmail: 'test.site@hcpa.fresh',
  };

  // Used for batch site POST
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

  it('Create new single site, receive success', async () => {
    siteBaseFields.siteId = 90;
    const res = await saveSingleSite(siteBaseFields);
    expect(res.siteId).toEqual(90);
    expect(res.id).toBeDefined();
  });

  it('Create duplicate single site, receive dupe', async () => {
    siteBaseFields.siteId = 91;
    const res = await saveSingleSite(siteBaseFields);
    expect(res.siteId).toEqual(91);
    expect(res.id).toBeDefined();

    try {
      await saveSingleSite(siteBaseFields);
    } catch (excp) {
      expect(excp.code).toEqual('23505');
    }
  });

  it('Create new site via batch, receive success', async () => {
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
    siteBaseFields.siteId = 92;
    const sitePostRes = await saveSingleSite(siteBaseFields);
    expect(sitePostRes.siteId).toEqual(92);
    expect(sitePostRes.id).toBeDefined();

    const res = await getSiteByID(sitePostRes.id);
    expect(res).toEqual(
      expect.arrayContaining(
        [siteBaseFields].map((item) => (expect.objectContaining(item))),
      ),
    );
  });

  it('gets a site before and after hires have been made', async () => {
    const [res] = await getSiteByID(1);
    expect(res.hcapHires).toEqual('0');
    expect(res.nonHcapHires).toEqual('0');
    await makeParticipant(participant1);
    await makeParticipant(participant2);
    const { data: [ppt, ppt2] } = await getParticipants({ isMoH: true });
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

  it('checks response from the site participants endpoint', async () => {
    await closeDB();
    await startDB();

    const siteResponse = await saveSites(site);
    const expectedSite = [
      { siteId: 67, status: 'Success' },
    ];
    expect(siteResponse).toEqual(expectedSite);

    const [res] = await getSiteByID(1);
    await makeParticipant(participant1);
    await makeParticipant(participant2);
    const { data: [ppt, ppt2] } = await getParticipants({ isMoH: true });
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
    const [site1] = await getSiteByID(1);
    const res2 = await getHiredParticipantsBySite(site1.siteId);
    expect(res2.length).toEqual(2);
  });
});
