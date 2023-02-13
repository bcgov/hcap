import { dbClient, collections } from '../../db';
import { participantData, psiData, cohortData } from './testData';
import { makeParticipant } from '../../services/participants';
import { createPostHireStatus } from '../../services/post-hire-flow';
import { makePSI } from '../../services/post-secondary-institutes';
import { makeCohort, assignCohort } from '../../services/cohorts';
import { saveSingleSite } from '../../services/employers';
import { createGlobalPhase } from '../../services/phase';

export const makeTestPostHireStatus = async ({ email, status, data = {} }) => {
  const participantObj = participantData({ emailAddress: email });
  const participant = await makeParticipant(participantObj);
  const postHireStatus = await createPostHireStatus({
    participantId: participant.id,
    status,
    data,
  });
  return { participant, postHireStatus };
};

export const makeTestParticipant = async (options) => makeParticipant(participantData(options));

interface cohortAssignmentData {
  cohortName?: string;
  cohortId?;
  email?: string;
  participantId?;
  psiName?: string;
  psiId?;
}
export const makeCohortAssignment = async ({
  cohortName,
  cohortId,
  email,
  participantId,
  psiName,
  psiId,
}: cohortAssignmentData) => {
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

interface testSiteData {
  siteId;
  city?: string;
  siteName?: string;
  [key: string]: string | number | boolean;
}

export const makeTestSite = async (
  { siteId, city, siteName, ...rest }: testSiteData = { siteId: null, city: null, siteName: null }
) => {
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

export const makeTestPSI = async (psiDataObj) => makePSI(psiDataObj);

// These interfaces should be fleshed out and documented
interface makeTestParticipantStatusData {
  participantId?: number;
  employerId?: number;
  status;
  current?: boolean;
  data;
}
export const makeTestParticipantStatus = async ({
  participantId,
  employerId,
  status,
  current = true,
  data,
}: makeTestParticipantStatusData) =>
  dbClient.db[collections.PARTICIPANTS_STATUS].insert({
    participant_id: participantId,
    employer_id: employerId || 1,
    status,
    current,
    data,
  });

interface createTestParticipantStatusData {
  participantData;
  siteData?;
  status?: string;
}
export const createTestParticipantStatus = async ({
  participantData: participantDataObj,
  siteData,
  status,
}: createTestParticipantStatusData) => {
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

export const makeTestCohort = async ({
  cohortName,
  psiId,
  cohortSize,
  startDate = today,
  endDate,
}) => makeCohort(cohortData({ cohortName, psiID: psiId, cohortSize, startDate, endDate }));

export const makeTestFKAllocations = async (id) => {
  const site = await makeTestSite({
    siteId: id,
    siteName: 'Test Site 1040',
    city: 'Test City 1040',
  });

  const phaseData = {
    name: 'Test Phase',
    start_date: new Date(),
    end_date: new Date(),
  };
  const user = {
    id: 'noid',
  };
  expect(site.siteId).toBeDefined();
  const phase = await createGlobalPhase(phaseData, user);
  expect(phase.id).toBeDefined();
  return {
    site,
    phase,
  };
};
