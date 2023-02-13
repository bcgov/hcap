// Test execution code: npm run test:debug cohort.service.test.ts
const { startDB, closeDB } = require('./util/db');

// Utilities and helpers
const { before } = require('./util/testData');
const { makeCohortAssignment, makeTestCohort } = require('./util/integrationTestData');
const {
  changeCohortParticipant,
  getAssignCohort,
  findCohortByName,
  filterCohortParticipantsForUser,
  getCohortWithCalculatedFields,
} = require('../services/cohorts');
const { postHireStatuses } = require('../constants');

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

const cohortParticipant = ({
  status,
  isCurrent,
  healthAuthority,
}: {
  status?: string;
  isCurrent?: boolean;
  healthAuthority?: string;
}) => ({
  siteJoin: {
    body: {
      healthAuthority,
    },
  },
  postHireJoin: [
    {
      status,
      is_current: isCurrent,
    },
  ],
});

describe(`filterCohortParticipantsForUser`, () => {
  it("HA: should remove cohort participants outside of requesting user's region", () => {
    const cohortParticipants = [cohortParticipant({ healthAuthority: 'Northern' })];
    const requestingUser = {
      isHA: true,
      regions: ['Fraser'],
    };
    const filteredCohortParticipants = filterCohortParticipantsForUser(
      cohortParticipants,
      requestingUser
    );

    expect(filteredCohortParticipants).toStrictEqual([]);
  });

  it("HA: should note remove cohort participants within requesting user's region", () => {
    const cohortParticipants = [cohortParticipant({ healthAuthority: 'Northern' })];
    const requestingUser = {
      isHA: true,
      regions: ['Northern'],
    };
    const filteredCohortParticipants = filterCohortParticipantsForUser(
      cohortParticipants,
      requestingUser
    );

    expect(filteredCohortParticipants).toStrictEqual(cohortParticipants);
  });

  it('MOH: it should return all given cohort participants', () => {
    const cohortParticipants = [
      {
        siteJoin: {
          body: {
            healthAuthority: 'Northern',
          },
        },
      },
    ];

    const requestingUser = {
      isMoH: true,
    };

    const filteredCohortParticipants = filterCohortParticipantsForUser(
      cohortParticipants,
      requestingUser
    );

    expect(filteredCohortParticipants).toStrictEqual(cohortParticipants);
  });
});

describe(`getCohortWithCalculatedFields`, () => {
  it('calculates available cohort seats', () => {
    const cohort = {
      cohort_size: 10,
    };
    const cohortParticipants = [
      cohortParticipant({ status: postHireStatuses.cohortUnsuccessful, isCurrent: true }),
      cohortParticipant({ status: postHireStatuses.cohortUnsuccessful, isCurrent: true }),
    ];

    const cohortWithCalculatedFields = getCohortWithCalculatedFields(cohort, cohortParticipants);

    expect(cohortWithCalculatedFields.availableCohortSeats).toBe(8);
  });

  it('calculates unsuccessful cohort participants', () => {
    const cohort = {
      cohort_size: 10,
    };
    const cohortParticipants = [
      cohortParticipant({ status: postHireStatuses.cohortUnsuccessful, isCurrent: true }),
      cohortParticipant({ status: postHireStatuses.cohortUnsuccessful, isCurrent: true }),
      cohortParticipant({ status: postHireStatuses.cohortUnsuccessful, isCurrent: false }), // not counted
      cohortParticipant({
        status: postHireStatuses.postSecondaryEducationCompleted,
        isCurrent: true,
      }), // not counted
    ];

    const cohortWithCalculatedFields = getCohortWithCalculatedFields(cohort, cohortParticipants);

    expect(cohortWithCalculatedFields.unsuccessfulParticipants).toBe(2);
  });
});
