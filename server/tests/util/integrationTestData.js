const { dbClient, collections } = require('../../db');
const { participantData, psiData, cohortData } = require('./testData');
const { makeParticipant } = require('../../services/participants');
const { createPostHireStatus } = require('../../services/post-hire-flow');
const { makePSI } = require('../../services/post-secondary-institutes');
const { makeCohort, assignCohort } = require('../../services/cohorts');
const { saveSingleSite } = require('../../services/employers');

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

const makeTestSite = async ({ siteId, city, siteName, ...rest } = {}) => {
  if (!siteId) {
    throw new Error('Site ID is required');
  }
  return saveSingleSite({
    siteId,
    city,
    siteName,
    ...rest,
  });
};

const makeTestPSI = async (psiDataObj) => makePSI(psiDataObj);

const makeTestParticipantStatus = async ({
  participantId,
  employerId,
  status,
  current = true,
  data,
}) =>
  dbClient.db[collections.PARTICIPANTS_STATUS].insert({
    participant_id: participantId,
    employer_id: employerId || 1,
    status,
    current,
    data,
  });

const createTestParticipantStatus = async ({
  participantData: participantDataObj,
  siteData,
  status,
}) => {
  const participant = await makeTestParticipant(participantDataObj);
  const site = await makeTestSite(siteData);
  const participantStatus = await makeTestParticipantStatus({
    participantId: participant.id,
    status: status || 'hired',
    current: true,
    data: {
      site: site.siteId,
    },
  });
  return { participant, site, participantStatus };
};

const today = new Date();
const makeTestCohort = async ({ cohortName, psiId, cohortSize, startDate = today, endDate }) =>
  makeCohort(cohortData({ cohortName, psiID: psiId, cohortSize, startDate, endDate }));

module.exports = {
  makeTestParticipant,
  makeTestPostHireStatus,
  makeCohortAssignment,
  makeTestSite,
  makeTestParticipantStatus,
  createTestParticipantStatus,
  makeTestCohort,
  makeTestPSI,
};
