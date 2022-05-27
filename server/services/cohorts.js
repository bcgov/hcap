const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

const { dbClient, collections } = require('../db');
const { validate, CreateCohortSchema } = require('../validation');
const { getPostHireStatusesForParticipant } = require('./post-hire-flow');
const { postHireStatuses } = require('../constants');

// Setup dayjs utc
dayjs.extend(utc);

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
    .find(
      {
        'cohortParticipant.is_current': true,
      },
      {
        order: [
          {
            field: `${collections.COHORT_PARTICIPANTS}.created_at`,
            direction: 'DESC',
            nulls: 'LAST',
          },
        ],
      }
    );

  return cohorts;
};

const assignCohort = async ({ id, participantId }) => {
  // unassign pervious cohorts and update status
  await dbClient.db[collections.COHORT_PARTICIPANTS].update(
    { participant_id: participantId },
    {
      is_current: false,
    }
  );
  await dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS].update(
    { participant_id: participantId },
    {
      is_current: false,
    }
  );

  // assign a new cohort
  const newParticipantCohort = await dbClient.db[collections.COHORT_PARTICIPANTS].insert({
    cohort_id: id,
    participant_id: participantId,
  });
  return newParticipantCohort;
};

const getCountOfAllocation = async ({ cohortId } = {}) =>
  dbClient.db[collections.COHORT_PARTICIPANTS].count({
    cohort_id: cohortId,
  });

const findCohortByName = async ({ cohortName, psiName }) =>
  dbClient.db[collections.COHORTS]
    .join({
      psi: {
        relation: collections.POST_SECONDARY_INSTITUTIONS,
        type: 'INNER',
        decomposeTo: 'object',
        on: {
          id: 'psi_id',
          institute_name: psiName,
        },
      },
    })
    .find({
      cohort_name: cohortName,
    });

const changeCohortParticipant = async (
  { cohortId, participantId, newCohortId, meta } = { meta: {} }
) => {
  // Get existing participant cohort map
  const participantCohort = await dbClient.db[collections.COHORT_PARTICIPANTS].findOne({
    participant_id: participantId,
  });
  if (!participantCohort || !participantCohort.id) {
    throw new Error('Participant not found in cohort');
  }
  if (participantCohort.cohort_id !== cohortId) {
    throw new Error('Participant not in cohort');
  }
  // Get Graduation Status of Participant
  const participantPostHireStatuses =
    (await getPostHireStatusesForParticipant({ participantId })) || [];
  // Get cohort details for both
  const newCohort = await dbClient.db[collections.COHORTS].findOne({
    id: newCohortId,
  });
  if (!newCohort) {
    throw new Error('New Cohort not found');
  }

  // Update all data in transaction
  const resp = await dbClient.db.withTransaction(async (tnx) => {
    // Update Cohort Participant
    await tnx[collections.COHORT_PARTICIPANTS].update(participantCohort.id, {
      cohort_id: newCohortId,
    });
    // Update post-hire status
    let newPostHireStatuses;
    let isGraduated = false;
    if (participantPostHireStatuses.length > 0) {
      // Check participant is graduated or not
      isGraduated = participantPostHireStatuses.some(
        (postHireStatus) =>
          postHireStatus.status === postHireStatuses.postSecondaryEducationCompleted
      );
      // Delete all post-hire graduations statuses
      // Delete Post-Hire Status
      await tnx[collections.PARTICIPANT_POST_HIRE_STATUS].destroy({
        participant_id: participantId,
        status: postHireStatuses.postSecondaryEducationCompleted,
      });
    }
    // Now check New cohort is expired or not and participant is graduated or not
    if (isGraduated && newCohort.end_date && newCohort.end_date < new Date()) {
      // Update Post-Hire Status
      newPostHireStatuses = await tnx[collections.PARTICIPANT_POST_HIRE_STATUS].insert({
        participant_id: participantId,
        status: postHireStatuses.postSecondaryEducationCompleted,
        data: {
          graduationDate: dayjs.utc(newCohort.end_date).format('YYYY/MM/DD'),
        },
      });
    }

    // Update audit log
    let audit;
    if (Object.keys(meta).length > 0) {
      const { user, ...rest } = meta;
      audit = await tnx[collections.ADMIN_OPS_AUDIT].insert({
        user: meta.user || 'system',
        data: {
          operationMetaData: rest,
          operationDetails: {
            operation: 'changeCohortParticipant',
            cohortId,
            participantId,
            newCohortId,
            participantPostHireStatuses,
            newPostHireStatuses,
          },
        },
      });
    }

    return {
      audit,
      newPostHireStatuses,
      oldPostHireStatus: participantPostHireStatuses || [],
    };
  });
  return resp;
};

module.exports = {
  getCohorts,
  getPSICohorts,
  getCohort,
  makeCohort,
  assignCohort,
  getAssignCohort,
  updateCohort,
  getCountOfAllocation,
  changeCohortParticipant,
  findCohortByName,
};
