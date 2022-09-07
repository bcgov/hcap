import store from 'store';
import { API_URL } from '../constants';
import { formatCohortDate } from '../utils';

const baseURL = `${API_URL}/api/v1`;

const getCohortAvailAbleSize = (cohort) =>
  cohort.cohort_size - (cohort.participantsCohorts?.length || 0);

export const getPsi = async () => {
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

export const fetchCohort = async ({ cohortId }) => {
  const response = await fetch(`${API_URL}/api/v1/cohorts/${cohortId}/participants`, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    const cohort = await response.json();
    return cohort;
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
        startDate: formatCohortDate(cohort.start_date, { isForm: true }),
        endDate: formatCohortDate(cohort.end_date, { isForm: true }),
        cohortSize: cohort.cohort_size,
      }
    : null;

/**
 * createPSI: Creating psi object in remote db
 * @param {*} object psi details object
 * @returns [Boolean, string] tuple Boolean indicates success and string is error message
 */
export const createPSI = async ({ psi }) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/psi`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(psi),
    });

    if (response.ok) {
      return [true, null];
    } else {
      if (response.status === 409) {
        try {
          const errorDetails = await response.json();
          return [
            false,
            errorDetails.error ||
              errorDetails.message ||
              'Unable to create psi due to server error',
          ];
        } catch {
          return [false, 'Unable to create psi due to server error'];
        }
      }
      return [false, (await response.text()) || 'Unable to create post secondary institute'];
    }
  } catch (error) {
    return [false, `Unable to create PSI due to error: ${error}`];
  }
};

export const updatePSI = async ({ id, psi }) => {
  const resp = await fetch(`${API_URL}/api/v1/psi/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(psi),
  });

  // Decode response
  const responseMessage = await resp.text();
  if (resp.ok) {
    return [true, null];
  }
  return [false, responseMessage];
};
