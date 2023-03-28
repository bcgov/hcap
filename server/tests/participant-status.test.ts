// Test execution code: npm run test:debug participant-status.test.js
import { v4 } from 'uuid';

import { dbClient, collections } from '../db';
import { getParticipants } from '../services/participants';

import { setParticipantStatus, hideStatusForUser } from '../services/participant-status';

import { startDB, closeDB } from './util/db';
import { makeTestParticipant, makeTestSite } from './util/integrationTestData';

import { ParticipantStatus } from '../constants';

const {
  PROSPECTING,
  INTERVIEWING,
  OFFER_MADE,
  HIRED,
  ARCHIVED,
  INVALID_STATUS_TRANSITION,
  INVALID_ARCHIVE,
  REJECTED,
  REJECT_ACKNOWLEDGEMENT,
} = ParticipantStatus;

const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

describe('Test Participant status data model and service', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  it('should set participant statuses', async () => {
    const participant = await makeTestParticipant({
      emailAddress: 'test.set.status@hcap.io',
    });
    const site = await makeTestSite({
      siteId: 202205061150,
      siteName: 'Test Site 10001',
      city: 'Test City 10001',
    });

    const emp1 = { id: v4(), sites: [site.siteId] };
    const emp2 = { id: v4(), sites: [site.siteId] };

    const ps1 = await setParticipantStatus(
      emp1.id,
      participant.id,
      PROSPECTING,
      {
        site: site.siteId,
      },
      emp1
    );

    // Verify newly created status
    const prospectingStatus = await dbClient.db[collections.PARTICIPANTS_STATUS].findOne({
      participant_id: participant.id,
      'data.site': site.siteId,
    });
    expect(prospectingStatus).toBeDefined();
    expect(prospectingStatus.status).toBe(PROSPECTING);
    // Moving to next status
    let result = await setParticipantStatus(
      emp2.id,
      participant.id,
      INTERVIEWING,
      {
        site: site.siteId,
      },
      emp2,
      ps1.id
    );
    expect(result.status).not.toBe(INVALID_STATUS_TRANSITION);

    // Read participant status with sites
    const existingStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
      participant_id: participant.id,
      'data.site': site.siteId,
    });
    expect(existingStatuses.length).toBe(2);

    // Move to offer made and hired
    const ps2 = await setParticipantStatus(
      emp2.id,
      participant.id,
      OFFER_MADE,
      {
        site: site.siteId,
      },
      emp2,
      result.id
    );
    expect(
      (
        await dbClient.db[collections.PARTICIPANTS_STATUS].find({
          participant_id: participant.id,
          'data.site': site.siteId,
        })
      ).length
    ).toBe(3);
    const ps3 = await setParticipantStatus(
      emp2.id,
      participant.id,
      HIRED,
      {
        site: site.siteId,
      },
      emp2,
      ps2.id
    );
    expect(
      (
        await dbClient.db[collections.PARTICIPANTS_STATUS].find({
          participant_id: participant.id,
          'data.site': site.siteId,
        })
      ).length
    ).toBe(4);
    expect(
      (
        await dbClient.db[collections.PARTICIPANTS_STATUS].findOne({
          participant_id: participant.id,
          current: true,
        })
      ).status
    ).toBe(HIRED);

    // Archived by emp1
    result = await setParticipantStatus(emp1.id, participant.id, ARCHIVED, {}, emp1, ps3.id);
    expect(result.status).not.toBe(INVALID_ARCHIVE);
    expect(result.status).not.toBe(INVALID_STATUS_TRANSITION);
    const allStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
      participant_id: participant.id,
    });
    // Testing all statuses with ack for hiring employer
    expect(allStatuses.length).toBe(6);
    // Check participant previous hired get invalidated
    const previousHiredStatus = await dbClient.db[collections.PARTICIPANTS_STATUS].findOne({
      participant_id: participant.id,
      status: HIRED,
    });
    expect(previousHiredStatus.current).toBe(false);
    expect(previousHiredStatus.employer_id).toBe(emp2.id);
  });

  it('should return multi org participant', async () => {
    const participant = await makeTestParticipant({
      emailAddress: 'test.site.participant.3@hcap.io',
    });

    const site1 = await makeTestSite({
      siteId: 202204221211,
      siteName: 'Test Site 1030',
      city: 'Test City 1030',
    });

    const site2 = await makeTestSite({
      siteId: 202204221212,
      siteName: 'Test Site 1030',
      city: 'Test City 1030',
    });

    const emp1 = { id: v4(), sites: [site1.siteId, site2.siteId] };
    const emp2 = { id: v4(), sites: [site1.siteId] };
    const emp3 = { id: v4(), sites: [site2.siteId] };

    const ps1 = await setParticipantStatus(
      emp1.id,
      participant.id,
      PROSPECTING,
      {
        site: site1.siteId,
      },
      emp1
    );

    // Check with open status for emp1
    const resultOpenWithEmp1 = await getParticipants(
      { isEmployer: true, id: emp1.id, regions, sites: emp1.sites },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['open']
    );
    const filteredOpenForEmp1 = resultOpenWithEmp1.data.filter((p) => p.id === participant.id);
    expect(filteredOpenForEmp1.length).toBe(0);

    // Check with open status for emp2
    const resultOpenWithEmp2 = await getParticipants(
      { isEmployer: true, id: emp2.id, regions, sites: emp2.sites },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['open']
    );
    const filteredOpenForEmp2 = resultOpenWithEmp2.data.filter((p) => p.id === participant.id);
    expect(filteredOpenForEmp2.length).toBe(0);

    const resultSuccess = await getParticipants(
      { isEmployer: true, id: emp2.id, regions, sites: emp2.sites },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['prospecting']
    );
    expect(resultSuccess.data.length).toBeGreaterThanOrEqual(1);
    expect(resultSuccess.data[0].id).toBe(participant.id);

    const resultFailure = await getParticipants(
      { isEmployer: true, id: emp3.id, regions, sites: emp3.sites },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['prospecting']
    );

    expect(resultFailure.data.length).toBe(0);

    // Now set next status, for the same site
    await setParticipantStatus(
      emp2.id,
      participant.id,
      INTERVIEWING,
      {
        site: site1.siteId,
      },
      emp2,
      ps1.id
    );

    // Read by multi org employer
    const resultSuccess2 = await getParticipants(
      { isEmployer: true, id: emp1.id, regions, sites: emp1.sites },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['interviewing']
    );

    expect(resultSuccess2.data.length).toBeGreaterThanOrEqual(1);
    expect(resultSuccess2.data[0].id).toBe(participant.id);

    // Test Open status
    const resultOpen = await getParticipants(
      { isEmployer: true, id: emp3.id, regions, sites: emp3.sites },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['open']
    );

    // Check result for participant
    const filteredOpen = resultOpen.data.filter((p) => p.id === participant.id);
    expect(filteredOpen.length).toBe(1);

    // Now check dual statuses, prospect participant by another employer for another site
    await setParticipantStatus(
      emp3.id,
      participant.id,
      PROSPECTING,
      {
        site: site2.siteId,
      },
      emp3
    );

    // Get statuses with emp1 for Dual statuses for mult org employee
    const resultDual = await getParticipants(
      { isEmployer: true, id: emp1.id, regions, sites: emp1.sites },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['prospecting', 'interviewing']
    );
    const dualStatuses = resultDual.data.filter((p) => p.id === participant.id);
    expect(dualStatuses.length).toBe(2);
  });

  it('should reject participant', async () => {
    const participant = await makeTestParticipant({
      emailAddress: 'test.site.participant.4@hcap.io',
    });

    const site1 = await makeTestSite({
      siteId: 202205252325,
      siteName: 'Test Site 1040',
      city: 'Test City 1040',
    });

    const emp1 = {
      id: v4(),
      isEmployer: true,
      regions,
      sites: [site1.siteId],
    };

    const emp2 = {
      id: v4(),
      isEmployer: true,
      regions,
      sites: [site1.siteId],
    };

    const ps1 = await setParticipantStatus(
      emp1.id,
      participant.id,
      PROSPECTING,
      {
        site: site1.siteId,
      },
      emp1
    );
    expect(ps1.status).toBe('prospecting');

    const ps2 = await setParticipantStatus(
      emp1.id,
      participant.id,
      REJECTED,
      {
        site: site1.siteId,
        final_status: 'withdrawn',
      },
      emp1,
      ps1.id
    );
    expect(ps2.status).toBe(REJECTED);

    const statuses = await getParticipants(emp2, null, null, null, null, null, null, null, null, [
      'prospecting',
      'interviewing',
    ]);
    expect(statuses.data.length).toBeGreaterThanOrEqual(1);
    const subject = statuses.data.find((p) => p.id === participant.id);
    expect(subject).toBeDefined();
    const { statusInfos = [] } = subject;
    expect(statusInfos.length).toBeGreaterThanOrEqual(1);
    const statusInfo = statusInfos[0];
    expect(statusInfo.status).toBe(REJECT_ACKNOWLEDGEMENT);
    expect(statusInfo.data?.final_status).toBe('withdrawn');

    // Check reject status for employer1
    const resultReject = await getParticipants(
      emp1,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [REJECTED]
    );
    expect(resultReject.data.length).toBeGreaterThanOrEqual(1);
    const filteredReject = resultReject.data.find((p) => p.id === participant.id);
    expect(filteredReject).toBeDefined();
    expect(filteredReject.statusInfos.length).toBeGreaterThanOrEqual(1);
    const rejectStatusInfo = filteredReject.statusInfos[0];
    expect(rejectStatusInfo.data?.final_status).toBe('withdrawn');

    // No reject for emp2
    const resultNoReject = await getParticipants(
      emp2,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [REJECTED]
    );
    expect(resultNoReject.data.length).toBe(0);
  });

  it('should hide status for user', async () => {
    const participant = await makeTestParticipant({
      emailAddress: 'test.site.participant.5@hcap.io',
    });

    const site1 = await makeTestSite({
      siteId: 202205270022,
      siteName: 'Test Site 1050',
      city: 'Test City 1050',
    });

    const emp1 = {
      id: v4(),
      isEmployer: true,
      regions,
      sites: [site1.siteId],
    };

    const ps1 = await setParticipantStatus(
      emp1.id,
      participant.id,
      PROSPECTING,
      {
        site: site1.siteId,
      },
      emp1
    );
    expect(ps1.status).toBe('prospecting');

    // Hide status for user
    await hideStatusForUser({ userId: emp1.id, statusId: ps1.id });

    // Get status and check
    const statuses = await getParticipants(emp1, null, null, null, null, null, null, null, null, [
      'prospecting',
    ]);

    expect(statuses.data.length).toBe(0);

    // Check for employer2
    const emp2 = {
      id: v4(),
      isEmployer: true,
      regions,
      sites: [site1.siteId],
    };

    const statuses2 = await getParticipants(emp2, null, null, null, null, null, null, null, null, [
      'prospecting',
    ]);

    expect(statuses2.data.length).toBeGreaterThanOrEqual(1);
    const subject = statuses2.data.find((p) => p.id === participant.id);
    expect(subject).toBeDefined();
    const { statusInfos = [] } = subject;
    expect(statusInfos.length).toBeGreaterThanOrEqual(1);
    const statusInfo = statusInfos[0];
    expect(statusInfo.status).toBe('prospecting');
  });

  it('should add preferred location if hired in a region not currently in participant preferred location', async () => {
    const initialPreferredLocation = 'Fraser';
    const siteLocation = 'Interior';

    const participant = await makeTestParticipant({
      emailAddress: 'test.set.status.preferred.location@hcap.io',
      preferredLocation: initialPreferredLocation,
    });
    const site = await makeTestSite({
      siteId: '202303161650',
      siteName: 'Test Site 20001',
      city: 'Test City 20001',
      healthAuthority: siteLocation,
    });
    const emp1 = { id: v4(), sites: [site.siteId] };

    const ps1 = await setParticipantStatus(
      emp1.id,
      participant.id,
      PROSPECTING,
      {
        site: site.siteId,
      },
      emp1
    );

    const ps2 = await setParticipantStatus(
      emp1.id,
      participant.id,
      INTERVIEWING,
      {
        site: site.siteId,
      },
      emp1,
      ps1.id
    );

    const ps3 = await setParticipantStatus(
      emp1.id,
      participant.id,
      OFFER_MADE,
      {
        site: site.siteId,
      },
      emp1,
      ps2.id
    );

    await setParticipantStatus(
      emp1.id,
      participant.id,
      HIRED,
      {
        site: site.siteId,
      },
      emp1,
      ps3.id
    );

    const participantUpdated = await dbClient.db[collections.PARTICIPANTS].findOne({
      id: participant.id,
    });
    expect(participantUpdated.body.preferredLocation).toEqual(
      `${initialPreferredLocation};${siteLocation}`
    );
  });
});
