import dayjs from 'dayjs';
import { DEFAULT_STATUS } from '../../constants';

const mapGraduationStatus = (status) => {
  switch (status) {
    case 'cohort_unsuccessful':
      return 'Unsuccessful cohort';
    case 'post_secondary_education_completed':
      return 'Graduated';
    default:
      return status;
  }
};

const mapIntendToReturn = (value) => {
  switch (value) {
    case 'continue_yes':
      return 'Yes';
    case 'continue_no':
      return 'No';
    default:
      return value;
  }
};

export const getPostHireStatusForParticipant = (postHireStatuses) => {
  const graduationStatus = {
    isReturning: DEFAULT_STATUS,
    status: DEFAULT_STATUS,
    date: DEFAULT_STATUS,
  };
  if (!postHireStatuses) return graduationStatus;
  const currentStatus = postHireStatuses.find((status) => status.is_current);
  if (!currentStatus) return graduationStatus;

  return {
    isReturning: mapIntendToReturn(currentStatus.data?.continue) || DEFAULT_STATUS,
    status: mapGraduationStatus(currentStatus.status) || DEFAULT_STATUS,
    date:
      currentStatus.data?.unsuccessfulCohortDate ||
      currentStatus.data?.graduationDate ||
      DEFAULT_STATUS,
  };
};

export const getCohortForParticipant = (cohorts, cohortParticipants) => {
  const cohortData = {
    psiId: DEFAULT_STATUS,
    name: DEFAULT_STATUS,
    startDate: DEFAULT_STATUS,
    endDate: DEFAULT_STATUS,
  };
  if (!cohorts || !cohortParticipants) return cohortData;

  const cohortId = cohortParticipants.find((cohortMap) => cohortMap.is_current)?.cohort_id;
  if (!cohortId) return cohortData;
  const currentCohort = cohorts.find((cohort) => cohort.id === cohortId);

  return {
    psiId: currentCohort.psi_id || DEFAULT_STATUS,
    name: currentCohort.cohort_name || DEFAULT_STATUS,
    startDate: dayjs(currentCohort.start_date).format('YYYY/MM/DD') || DEFAULT_STATUS,
    endDate: dayjs(currentCohort.end_date).format('YYYY/MM/DD') || DEFAULT_STATUS,
  };
};
