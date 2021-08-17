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

const makeCohort = async (cohort) => {
  const cohortSize = parseInt(cohort.cohortSize, 10);

  const data = {
    cohort_name: cohort.cohortName,
    start_date: cohort.startDate,
    end_date: cohort.endDate,
    cohort_size: cohortSize,
    psi_id: cohort.psiID,
  };

  await validate(CreateCohortSchema, data);

  const newCohort = await dbClient.db[collections.COHORTS].insert(data);
  return newCohort;
};

const assignCohort = async ({ id, participantId }) => {
  const participantCohort = await dbClient.db[collections.COHORT_PARTICIPANTS].insert({
    cohort_id: id,
    participant_id: participantId,
  });
  return participantCohort;
};

module.exports = {
  getCohorts,
  getPSICohorts,
  getCohort,
  makeCohort,
  assignCohort,
};
