import { v4 } from 'uuid';
import { app } from '../server';
import { ParticipantStatus as ps } from '../constants';

import { saveSingleSite, getSitesForUser, getSiteByID, updateSite } from '../services/employers';

import {
  getParticipants,
  makeParticipant,
  getHiredParticipantsBySite,
} from '../services/participants';

import { setParticipantStatus } from '../services/participant-status';

import { startDB, closeDB } from './util/db';

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
    address: '123 XYZ',
    city: 'Victoria',
    isRHO: false,
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
    address: '123 XYZ',
    city: 'Victoria',
    isRHO: true,
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
    const res = await saveSingleSite({ ...siteBaseFields, siteId: 90 });
    expect(res.siteId).toEqual(90);
    expect(res.id).toBeDefined();
  });

  it('Create duplicate single site, receive dupe', async () => {
    const dupeSite = { ...siteBaseFields, siteId: 91 };
    const res = await saveSingleSite(dupeSite);
    expect(res.siteId).toEqual(91);
    expect(res.id).toBeDefined();

    try {
      await saveSingleSite(dupeSite);
    } catch (excp) {
      expect(excp.code).toEqual('23505');
    }
  });

  it('Creates a new site, receives success', async () => {
    await expect(saveSingleSite(site)).resolves.not.toThrow();
  });

  it('Get sites, receive all successfully', async () => {
    const res = await getSitesForUser({ roles: ['ministry_of_health'] });
    expect(res.length).toEqual(3); // dependent on previous tests
    expect(res).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          healthAuthority: site.healthAuthority,
          postalCode: site.postalCode,
          siteId: site.siteId,
          siteName: site.siteName,
        }),
      ])
    );
  });

  it('Gets a single site', async () => {
    const siteToGet = { ...siteBaseFields, siteId: 92 };
    const sitePostRes = await saveSingleSite(siteToGet);
    expect(sitePostRes.siteId).toEqual(92);
    expect(sitePostRes.id).toBeDefined();

    const res = await getSiteByID(sitePostRes.id);
    expect(res).toEqual(expect.objectContaining(siteToGet));
  });

  it('gets a site before and after hires have been made', async () => {
    const res = await getSiteByID(1);
    expect(res.hcapHires).toEqual('0');
    expect(res.nonHcapHires).toEqual('0');
    await makeParticipant(participant1);
    await makeParticipant(participant2);
    const {
      data: [ppt, ppt2],
    } = await getParticipants({ isMoH: true });
    await setParticipantStatus(employerAId, ppt.id, ps.PROSPECTING);
    await setParticipantStatus(employerAId, ppt.id, ps.INTERVIEWING);
    await setParticipantStatus(employerAId, ppt.id, ps.OFFER_MADE);
    await setParticipantStatus(employerAId, ppt.id, ps.HIRED, {
      site: res.siteId,
      nonHcapOpportunity: false,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    await setParticipantStatus(employerBId, ppt2.id, ps.PROSPECTING);
    await setParticipantStatus(employerBId, ppt2.id, ps.INTERVIEWING);
    await setParticipantStatus(employerBId, ppt2.id, ps.OFFER_MADE);
    await setParticipantStatus(employerBId, ppt2.id, ps.HIRED, {
      site: res.siteId,
      nonHcapOpportunity: true,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    const res1 = await getSiteByID(1);
    expect(res1.hcapHires).toEqual('1');
    expect(res1.nonHcapHires).toEqual('1');
    expect(res1.allocation).toBeDefined();
  });

  it('Create new site, receive duplicated', async () => {
    const [result] = await Promise.allSettled([saveSingleSite(site)]);
    expect(result.status).toEqual('rejected');
    if (result.status === 'rejected') expect(result.reason.code).toEqual('23505');
  });

  it('Update site, receive success', async () => {
    const res = await updateSite(1, {
      siteName: 'test',
      history: [
        { timestamp: new Date(), changes: [{ field: 'siteName', from: 'test1', to: 'test' }] },
      ],
    });
    expect(res[0].siteName).toEqual('test');
  });

  it('checks response from the site participants endpoint', async () => {
    await closeDB();
    await startDB();

    await expect(saveSingleSite(site)).resolves.not.toThrow();

    const res = await getSiteByID(1);
    await makeParticipant(participant1);
    await makeParticipant(participant2);
    const {
      data: [ppt, ppt2],
    } = await getParticipants({ isMoH: true });
    await setParticipantStatus(employerAId, ppt.id, ps.PROSPECTING);
    await setParticipantStatus(employerAId, ppt.id, ps.INTERVIEWING);
    await setParticipantStatus(employerAId, ppt.id, ps.OFFER_MADE);
    await setParticipantStatus(employerAId, ppt.id, ps.HIRED, {
      site: res.siteId,
      nonHcapOpportunity: false,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    await setParticipantStatus(employerBId, ppt2.id, ps.PROSPECTING);
    await setParticipantStatus(employerBId, ppt2.id, ps.INTERVIEWING);
    await setParticipantStatus(employerBId, ppt2.id, ps.OFFER_MADE);
    await setParticipantStatus(employerBId, ppt2.id, ps.HIRED, {
      site: res.siteId,
      nonHcapOpportunity: true,
      positionTitle: 'title',
      positionType: 'posType',
      hiredDate: new Date(),
      startDate: new Date(),
    });
    const site1 = await getSiteByID(1);
    const res2 = await getHiredParticipantsBySite(site1.siteId);
    expect(res2.length).toEqual(2);
  });
});