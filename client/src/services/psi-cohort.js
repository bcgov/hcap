import store from 'store';
import { API_URL } from '../constants';

const baseURL = `${API_URL}/api/v1`;

const getCohortAvailAbleSize = (cohort) =>
  cohort.cohort_size - (cohort.participantsCohorts?.length || 0);

export const psi = async () => {
  const response = await fetch(`${baseURL}/psi/with-cohorts`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (response.ok) {
    const psiList = (await response.json()) || [];
    return psiList.map((psi) => ({
      ...psi,
      size:
        psi.cohorts?.reduce((incoming, cohort) => incoming + getCohortAvailAbleSize(cohort), 0) ||
        0,
      cohorts:
        psi.cohorts?.map((cohort) => ({
          ...cohort,
          availableSize: getCohortAvailAbleSize(cohort),
        })) || [],
    }));
  } else {
    throw new Error('Unable to load post secondary institutes');
  }
};

export const assignParticipantWithCohort = async ({ participantId, cohortId }) => {
  const response = await fetch(`${baseURL}/cohorts/${cohortId}/assign/${participantId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Unable to assign cohort');
  }
};

export const sortPSI = ({ psiList = [], cohort = {} }) =>
  psiList.sort((item1, item2) => {
    if (item1.institute_name === cohort.psi?.institute_name) {
      return -1;
    } else if (item2.institute_name === cohort.psi?.institute_name) {
      return 1;
    }
    return item1 < item2 ? -1 : item1 > item2 ? 1 : 0;
  });
