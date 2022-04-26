// Test execution code: npm run test:debug participant-status.test.js
const { v4 } = require('uuid');
const { dbClient, collections } = require('../db');
const {
  setParticipantStatus,
  getParticipants,
  bulkEngageParticipants,
} = require('../services/participants');
const { startDB, closeDB } = require('./util/db');
const {
  makeTestParticipant,
  makeTestParticipantStatus,
  makeTestSite,
} = require('./util/integrationTestData');

const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

describe('Test Participant status data model and service', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  it('should create site_participants_status item', async () => {
    // Create participant
    const participant = await makeTestParticipant({
      emailAddress: 'test.site.participant.1@hcap.io',
    });

    // Create status
    const status = await makeTestParticipantStatus({
      participantId: participant.id,
      status: 'interviewing',
      employerId: v4(),
      current: true,
      data: {},
    });

    // Site
    const site = await makeTestSite({
      siteId: 202204181210,
      siteName: 'Test Site 101',
      city: 'Test City 101',
    });

    // Create Item
    const item = await dbClient.db[collections.SITE_PARTICIPANTS_STATUS].insert({
      site_id: site.id,
      participant_status_id: status.id,
    });

    // Read and test
    const readItem = await dbClient.db[collections.SITE_PARTICIPANTS_STATUS].findOne({
      id: item.id,
    });

    expect(readItem).toBeDefined();
    expect(readItem.id).toBe(item.id);
    expect(readItem.site_id).toBe(site.id);
    expect(readItem.participant_status_id).toBe(status.id);
  });

  it('should update site_participants_status item with saving status', async () => {
    // Create participant
    const participant = await makeTestParticipant({
      emailAddress: 'test.site.participant.2@hcap.io',
    });

    const site1 = await makeTestSite({
      siteId: 202204181211,
      siteName: 'Test Site 1020',
      city: 'Test City 1020',
    });

    const site2 = await makeTestSite({
      siteId: 202204181212,
      siteName: 'Test Site 1021',
      city: 'Test City 1021',
    });

    await setParticipantStatus(v4(), participant.id, 'prospecting', {}, {}, [site1, site2]);

    // Read
    const items = await dbClient.db[collections.SITE_PARTICIPANTS_STATUS]
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
        'status.participant_id': participant.id,
      });

    expect(items.length).toBe(2);
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

  it('should bulk engage participants', async () => {
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
