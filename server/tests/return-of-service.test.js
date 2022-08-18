/* eslint-disable no-restricted-syntax, no-await-in-loop */
// Test execution code: npm run test:debug return-of-service.test.js
const { startDB, closeDB } = require('./util/db');
const { participantData, siteData } = require('./util/testData');
const { createTestParticipantStatus } = require('./util/integrationTestData');

const {
  insertReturnOfServiceStatus,
  getReturnOfServiceStatuses,
} = require('../services/return-of-service');

describe('Test return of service', () => {
  let testParticipant;
  let testSite;
  beforeAll(async () => {
    await startDB();

    const { participant, site } = await createTestParticipantStatus({
      participantData: participantData({ emailAddress: 'test.srv.ros@hcap.io' }),
      siteData: siteData({
        siteId: 7,
        siteName: 'Test Create ROS Service Global',
        operatorEmail: 'test.srv.ros.ops@hcap.io',
      }),
    });
    testParticipant = participant;
    testSite = site;
  });
  afterAll(async () => {
    await closeDB();
  });

  it('should create return of service', async () => {
    // Create Participant
    const { participant, site } = await createTestParticipantStatus({
      participantData: participantData({ emailAddress: 'test.save.ros@hcap.io' }),
      siteData: siteData({
        siteId: 77,
        siteName: 'Test Create ROS Site 1',
        operatorEmail: 'test.save.ros.ops@hcap.io',
      }),
    });
    expect(participant).toBeDefined();
    expect(site).toBeDefined();
    expect(site.siteId).toBe(77);

    const resp = await insertReturnOfServiceStatus({
      participantId: participant.id,
      data: {
        testId: 'ros-1',
      },
    });
    expect(resp).toBeDefined();
    expect(resp.id).toBeDefined();
  });

  it('should get return of service for participant', async () => {
    await insertReturnOfServiceStatus({
      participantId: testParticipant.id,
      data: {
        testId: 'ros-2',
      },
    });
    const [ros] = await getReturnOfServiceStatuses({
      participantId: testParticipant.id,
    });
    expect(ros).toBeDefined();
    expect(ros.data.testId).toBe('ros-2');
    expect(ros.site_id).toBe(testSite.id);
    expect(ros.participant_id).toBe(testParticipant.id);
    expect(ros.site).toBeDefined();
    expect(ros.site.id).toBe(testSite.id);
    expect(ros.is_current).toBe(true);
  });
});
