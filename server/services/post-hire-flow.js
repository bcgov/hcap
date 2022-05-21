const { dbClient, collections } = require('../db');

const createPostHireStatus = async ({ participantId, status, data }) =>
  dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS].insert({
    participant_id: participantId,
    status,
    data,
  });

const getPostHireStatusesForParticipant = async ({ participantId }) =>
  dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS].find(
    {
      participant_id: participantId,
    },
    {
      order: [{ field: 'created_at', direction: 'desc' }],
    }
  );

const getPostHireStatusesForCohortParticipant = async (participantId, cohortId) => {
  const statuses = await dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS]
    .join({
      cohortJoin: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'LEFT OUTER',
        on: {
          participant_id: 'participant_id',
        },
      },
    })
    .find(
      {
        participant_id: participantId,
        'cohortJoin.cohort_id': cohortId,
      },
      {
        order: [
          { field: `${collections.PARTICIPANT_POST_HIRE_STATUS}.created_at`, direction: 'DESC' },
        ],
      }
    );
  return statuses;
};

module.exports = {
  createPostHireStatus,
  getPostHireStatusesForParticipant,
  getPostHireStatusesForCohortParticipant,
};
