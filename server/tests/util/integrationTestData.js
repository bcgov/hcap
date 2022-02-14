const { participantData, psiData, cohortData } = require('./testData');
const { makeParticipant } = require('../../services/participants');
const { createPostHireStatus } = require('../../services/post-hire-flow');
const { makePSI } = require('../../services/post-secondary-institutes');
const { makeCohort, assignCohort } = require('../../services/cohorts');

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

const makeCohortAssignment = async ({
  cohortName,
  cohortId,
  email,
  participantId,
  psiName,
  psiId,
}) => {
  let finalParticipantId = participantId;
  let finalPSIId = psiId;
  let finalCohortId = cohortId;
  if (email) {
    const participant = await makeTestParticipant({ emailAddress: email });
    finalParticipantId = participant.id;
  }
  if (psiName) {
    const psiDataObj = psiData({ instituteName: psiName });
    const psi = await makePSI(psiDataObj);
    finalPSIId = psi.id;
  }
  if (cohortName) {
    const cohortDataObj = cohortData({ cohortName, psiID: finalPSIId, cohortSize: 1 });
    const cohort = await makeCohort(cohortDataObj);
    finalCohortId = cohort.id;
  }
  const cohortAssignment = await assignCohort({
    id: finalCohortId,
    participantId: finalParticipantId,
  });

  return {
    participantId: finalParticipantId,
    psiId: finalPSIId,
    cohortId: finalCohortId,
    cohortAssignmentId: cohortAssignment.id,
  };
};

module.exports = {
  makeTestParticipant,
  makeTestPostHireStatus,
  makeCohortAssignment,
};
