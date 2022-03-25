// Test execution code: npm run test:debug post-hire-flow.service.test.js
const { startDB, closeDB } = require('./util/db');

// Subjects
const {
  createPostHireStatus,
  getPostHireStatusesForParticipant,
} = require('../services/post-hire-flow');

// Utilities and helpers
const { participantData } = require('./util/testData');
const { makeParticipant } = require('../services/participants');
const { postHireStatuses } = require('../validation');

// Data Utility
const makeTestPostHireStatus = async ({ email, status, data = {} }) => {
  const participantObj = participantData({ emailAddress: email });
  const participant = await makeParticipant(participantObj);
  const postHireStatus = await createPostHireStatus({
    participantId: participant.id,
    status,
    data,
  });
  return { participant, postHireStatus };
};

describe('Test Post hire flow service', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  it('should create post-hire-status', async () => {
    const participantObj = participantData({ emailAddress: 'test.post.hire.status.creat@hcap.io' });
    const participant = await makeParticipant(participantObj);
    const postHireStatus = await createPostHireStatus({
      participantId: participant.id,
      status: postHireStatuses.postSecondaryEducationUnderway,
      data: {},
    });
    expect(postHireStatus).toBeDefined();
    expect(postHireStatus.id).toBeDefined();
  });

  it('should get participant status', async () => {
    const { participant, postHireStatus } = await makeTestPostHireStatus({
      email: 'test.post.hire.get.status@hcap.io',
      status: postHireStatuses.postSecondaryEducationCompleted,
    });

    const postHireStatusesOfParticipants = await getPostHireStatusesForParticipant({
      participantId: participant.id,
    });

    expect(postHireStatusesOfParticipants).toBeDefined();
    expect(postHireStatusesOfParticipants.length).toBe(1);
    expect(postHireStatusesOfParticipants[0].id).toBe(postHireStatus.id);
  });
});
