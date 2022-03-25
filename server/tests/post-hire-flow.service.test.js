// Test execution code: npm run test:debug post-hire-flow.service.test.js
const { startDB, closeDB } = require('./util/db');

// Subjects
const {
  createPostHireStatus,
  getPostHireStatusesForParticipant,
} = require('../services/post-hire-flow');

// Utilities and helpers
const { participantData, before } = require('./util/testData');
const { makeParticipant } = require('../services/participants');
const { postHireStatuses } = require('../validation');
const { makeCohortAssignment, makeTestCohort } = require('./util/integrationTestData');
const { changeCohortParticipant, getAssignCohort } = require('../services/cohorts');

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
  let testParticipant;
  let oldCohort;
  let newCohort;
  let testPsi;

  beforeAll(async () => {
    await startDB();
    const { psiId, participantId, cohortId } = await makeCohortAssignment({
      email: 'test.post.hire.global@hcap.io',
      cohortName: 'Test Cohort Old Global',
      psiName: 'Test PSI',
    });
    testParticipant = participantId;
    oldCohort = cohortId;
    testPsi = psiId;
    newCohort = await makeTestCohort({
      cohortName: 'Test Cohort New Global',
      psiId: testPsi,
      cohortSize: 10,
      endDate: before(1),
      startDate: before(2),
    });
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

  it('should test cohort re-assignment (change cohort)', async () => {
    const r = await changeCohortParticipant({
      participantId: testParticipant,
      cohortId: oldCohort,
      newCohortId: newCohort.id,
      meta: {
        user: 'test',
        operation: 'test-change-cohort',
      },
    });
    expect(r).toBeDefined();
    expect(r.audit).toBeDefined();
    expect(r.newPostHireStatuses).toBeDefined();
    const cohorts = await getAssignCohort({ participantId: testParticipant });
    expect(cohorts.length).toBeGreaterThan(0);
    expect(cohorts[0].id).toBe(newCohort.id);
  });
});
