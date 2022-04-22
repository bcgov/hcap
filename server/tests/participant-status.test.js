// Test execution code: npm run test:debug participant-status.test.js
const { v4 } = require('uuid');
const { dbClient, collections } = require('../db');
const { setParticipantStatus, getParticipants } = require('../services/participants');
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
  });
});
