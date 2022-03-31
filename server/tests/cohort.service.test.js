// Test execution code: npm run test:debug cohort.service.test.js
const { startDB, closeDB } = require('./util/db');

// Utilities and helpers
const { before } = require('./util/testData');
const { makeCohortAssignment, makeTestCohort } = require('./util/integrationTestData');
const {
  changeCohortParticipant,
  getAssignCohort,
  findCohortByName,
} = require('../services/cohorts');

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
    const cohorts = await getAssignCohort({ participantId: testParticipant });
    expect(cohorts.length).toBeGreaterThan(0);
    expect(cohorts[0].id).toBe(newCohort.id);
  });

  it('should find by name', async () => {
    const cohorts = await findCohortByName({
      cohortName: newCohort.cohort_name,
      psiName: 'Test PSI',
    });
    expect(cohorts.length).toBeGreaterThan(0);
    expect(cohorts[0].id).toBe(newCohort.id);
  });
});
