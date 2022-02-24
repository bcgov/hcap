const { dbClient, collections } = require('../db');
const { validate, CreateCohortSchema } = require('../validation');

// Gets all cohorts with their associated list of participants
const getCohorts = async () =>
  dbClient.db[collections.COHORTS]
    .join({
      participants: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'LEFT OUTER',
        on: {
          cohort_id: 'id',
        },
      },
    })
    .find();

const getCohort = async (id) =>
  dbClient.db[collections.COHORTS].find({
    id,
  });

// Get all Cohorts associated with a specific PSI
const getPSICohorts = async (psiID) =>
  dbClient.db[collections.COHORTS]
    .join({
      participants: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'LEFT OUTER',
        on: {
          cohort_id: 'id',
        },
      },
    })
    .find({
      psi_id: psiID,
    });

const mapDataToCohort = (cohort) => {
  const temp = {
    cohort_name: cohort.cohortName,
    start_date: cohort.startDate,
    end_date: cohort.endDate,
    cohort_size: parseInt(cohort.cohortSize, 10),
    psi_id: cohort.psiID,
  };
  // clean and remove undefined values
  const cleaned = Object.keys(temp).reduce(
    (acc, key) => (temp[key] ? { ...acc, [key]: temp[key] } : acc),
    {}
  );

  return cleaned;
};

const makeCohort = async (cohortData) => {
  const cohort = mapDataToCohort(cohortData);
  await validate(CreateCohortSchema, cohort);
  const newCohort = await dbClient.db[collections.COHORTS].insert(cohort);
  return newCohort;
};

const updateCohort = async (id, updateData) =>
  dbClient.db[collections.COHORTS].update(id, { ...mapDataToCohort(updateData) });

const assignCohort = async ({ id, participantId }) => {
  const participantCohort = await dbClient.db[collections.COHORT_PARTICIPANTS].insert({
    cohort_id: id,
    participant_id: participantId,
  });
  return participantCohort;
};

const getAssignCohort = async ({ participantId }) => {
  const cohorts = await dbClient.db[collections.COHORTS]
    .join({
      cohortParticipant: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'INNER',
        on: {
          cohort_id: 'id',
          participant_id: participantId,
        },
      },
      psi: {
        relation: collections.POST_SECONDARY_INSTITUTIONS,
        type: 'LEFT OUTER',
        decomposeTo: 'object',
        on: {
          id: 'psi_id',
        },
      },
    })
    .find();
  return cohorts;
};

const getCountOfAllocation = async ({ cohortId } = {}) =>
  dbClient.db[collections.COHORT_PARTICIPANTS].count({
    cohort_id: cohortId,
  });

module.exports = {
  getCohorts,
  getPSICohorts,
  getCohort,
  makeCohort,
  assignCohort,
  getAssignCohort,
  updateCohort,
  getCountOfAllocation,
};
