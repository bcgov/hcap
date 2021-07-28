const { dbClient, collections } = require('../db');
const { validate, CreateCohortSchema } = require('../validation');

const getCohorts = async () => dbClient.db[collections.COHORTS].find();

const getCohort = async (id) =>
  dbClient.db[collections.COHORTS].find({
    id,
  });

// Get all Cohorts associated with a specific PSI
const getPSICohorts = async (psiID) =>
  dbClient.db[collections.COHORTS].find({
    psi_id: psiID,
  });

const makeCohort = async (cohort) => {
  await validate(CreateCohortSchema, cohort);
  const data = {
    cohort_name: cohort.cohortName,
    start_date: cohort.startDate,
    end_date: cohort.endDate,
    cohort_size: cohort.size,
    psi_id: cohort.psiId,
  };

  const newCohort = await dbClient.db[collections.COHORTS].insert(data);
  return newCohort;
};

module.exports = {
  getCohorts,
  getPSICohorts,
  getCohort,
  makeCohort,
};
