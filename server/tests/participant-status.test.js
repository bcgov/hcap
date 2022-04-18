// Test execution code: npm run test:debug participant-status.test.js
const { v4 } = require('uuid');
const { dbClient, collections } = require('../db');
const { startDB, closeDB } = require('./util/db');
const {
  makeTestParticipant,
  makeTestParticipantStatus,
  makeTestSite,
} = require('./util/integrationTestData');

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
});
