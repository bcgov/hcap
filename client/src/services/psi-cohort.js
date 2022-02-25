import store from 'store';
import moment from 'moment';
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

export const fetchPSI = async ({ psiId }) => {
  const response = await fetch(`${API_URL}/api/v1/psi/${psiId}`, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    const psi = await response.json();
    return {
      id: psi.id,
      instituteName: psi.institute_name,
      healthAuthority: psi.health_authority,
      streetAddress: psi.street_address,
      postalCode: psi.postal_code,
      city: psi.city,
    };
  }

  throw new Error(
    response.error || response.statusText || 'Unable to load post secondary institutes'
  );
};

export const fetchCohorts = async ({ psiId }) => {
  const response = await fetch(`${API_URL}/api/v1/psi/${psiId}/cohorts/`, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    const cohortList = await response.json();
    return cohortList;
  }

  throw new Error(response.error || response.statusText || 'Unable to load cohorts details');
};

export const addCohort = async ({ psiId, cohort }) => {
  const response = await fetch(`${API_URL}/api/v1/psi/${psiId}/cohorts/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(cohort),
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(`Unable to add cohort for error ${response.error || response.statusText}`);
};

export const editCohort = async ({ cohort, cohortId }) => {
  // Remove id from cohort body
  const response = await fetch(`${API_URL}/api/v1/cohorts/${cohortId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(cohort),
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(`Unable to edit cohort for error: ${response.error || response.statusText}`);
};

export const mapCohortToFormData = (cohort) =>
  cohort
    ? {
        cohortName: cohort.cohort_name,
        startDate: moment(cohort.start_date).format('YYYY/MM/DD'),
        endDate: moment(cohort.end_date).format('YYYY/MM/DD'),
        cohortSize: cohort.cohort_size,
      }
    : null;
