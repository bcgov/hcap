const { participantData } = require('./testData');
const { makeParticipant } = require('../../services/participants');
// Subjects
const { createPostHireStatus } = require('../../services/post-hire-flow');

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

const makeTestParticipant = async (options) => makeParticipant(participantData(options));

module.exports = {
  makeTestParticipant,
  makeTestPostHireStatus,
};
