// Test execution code: npm run test:debug participant-status.test.js
const { v4 } = require('uuid');
const { dbClient, collections } = require('../db');
const { getParticipants } = require('../services/participants');

const { setParticipantStatus, bulkEngageParticipants } = require('../services/participant-status');

const { startDB, closeDB } = require('./util/db');
const { makeTestParticipant, makeTestSite } = require('./util/integrationTestData');

const { participantStatus } = require('../constants');

const {
  PROSPECTING,
  INTERVIEWING,
  OFFER_MADE,
  HIRED,
  ARCHIVED,
  INVALID_STATUS_TRANSITION,
  INVALID_ARCHIVE,
} = participantStatus;

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

    await setParticipantStatus(
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
      emp2
    );
    expect(result.status).not.toBe(INVALID_STATUS_TRANSITION);

    // Read participant status with sites
    const existingStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
      participant_id: participant.id,
      'data.site': site.siteId,
    });
    expect(existingStatuses.length).toBe(2);

    // Move to offer made and hired
    await setParticipantStatus(
      emp2.id,
      participant.id,
      OFFER_MADE,
      {
        site: site.siteId,
      },
      emp2
    );
    expect(
      (
        await dbClient.db[collections.PARTICIPANTS_STATUS].find({
          participant_id: participant.id,
          'data.site': site.siteId,
        })
      ).length
    ).toBe(3);
    await setParticipantStatus(
      emp2.id,
      participant.id,
      HIRED,
      {
        site: site.siteId,
      },
      emp2
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
    result = await setParticipantStatus(emp1.id, participant.id, ARCHIVED, {}, emp1);
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

  it.skip('should return multi org participant', async () => {
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

    const emp1 = v4();
    const emp2 = v4();
    const emp3 = v4();

    await setParticipantStatus(emp1, participant.id, 'prospecting', {}, {}, [site1]);

    // Check with open status for emp1
    const resultOpenWithEmp1 = await getParticipants(
      { isEmployer: true, id: emp1, regions, sites: [site1.siteId] },
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

    // Check with open status for emp3
    const resultOpenWithEmp2 = await getParticipants(
      { isEmployer: true, id: emp2, regions, sites: [site1.siteId] },
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
      { isEmployer: true, id: emp2, regions, sites: [site1.siteId] },
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
      { isEmployer: true, id: emp3, regions, sites: [site2.siteId] },
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

    // Now set next status
    await setParticipantStatus(
      emp2,
      participant.id,
      'interviewing',
      {},
      {
        sites: [site1.siteId],
      }
    );

    // Read by multi org employer
    const resultSuccess2 = await getParticipants(
      { isEmployer: true, id: emp1, regions, sites: [site1.siteId] },
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
      { isEmployer: true, id: emp3, regions, sites: [site2.siteId] },
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
  });

  it.skip('should bulk engage participants', async () => {
    const participant1 = await makeTestParticipant({
      emailAddress: 'test.site.participant.41@hcap.io',
    });

    const participant2 = await makeTestParticipant({
      emailAddress: 'test.site.participant.42@hcap.io',
    });

    const site1 = await makeTestSite({
      siteId: 202204260855,
      siteName: 'Test Site 1040',
      city: 'Test City 1040',
    });

    const site2 = await makeTestSite({
      siteId: 202204260856,
      siteName: 'Test Site 1041',
      city: 'Test City 1041',
    });

    const user = { isEmployer: true, id: v4(), regions, sites: [site1.siteId, site2.siteId] };

    const resp = await bulkEngageParticipants({
      sites: [site1, site2],
      participants: [participant1, participant2].map((p) => p.id),
      user,
    });

    // Response verification
    expect(resp).toBeDefined();
    expect(resp.length).toBe(2);
    expect(resp[0].participantId).toBe(participant1.id);
    expect(resp[1].participantId).toBe(participant2.id);
    expect(resp[0].success).toBe(true);
    expect(resp[1].success).toBe(true);

    // Data verification for participant1
    const items1 = await dbClient.db[collections.SITE_PARTICIPANTS_STATUS]
      .join({
        status: {
          relation: collections.PARTICIPANTS_STATUS,
          type: 'LEFT OUTER',
          decomposeTo: 'object',
          on: {
            id: 'participant_status_id',
          },
        },
      })
      .find({
        'status.participant_id': participant1.id,
      });

    expect(items1.length).toBe(2);

    const items2 = await dbClient.db[collections.SITE_PARTICIPANTS_STATUS]
      .join({
        status: {
          relation: collections.PARTICIPANTS_STATUS,
          type: 'LEFT OUTER',
          decomposeTo: 'object',
          on: {
            id: 'participant_status_id',
          },
        },
      })
      .find({
        'status.participant_id': participant2.id,
      });

    expect(items2.length).toBe(2);
  });
});
