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

module.exports = {
  createPostHireStatus,
  getPostHireStatusesForParticipant,
};
