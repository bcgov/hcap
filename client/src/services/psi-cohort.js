import { formatCohortDate } from '../utils';
import { axiosInstance } from './api';

const getCohortAvailAbleSize = (cohort) =>
  cohort.cohort_size - (cohort.participantsCohorts?.length || 0);

export const getPsi = async () => {
  try {
    const { data } = await axiosInstance.get('/psi/with-cohorts');

    const psiList = data || [];
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
  } catch {
    throw new Error('Unable to load post secondary institutes');
  }
};

export const assignParticipantWithCohort = async ({ participantId, cohortId }) => {
  try {
    const { data } = await axiosInstance.post(`/cohorts/${cohortId}/assign/${participantId}`);

    return data;
  } catch {
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
  try {
    const { data: psi } = await axiosInstance.get(`/psi/${psiId}`);

    return {
      id: psi.id,
      instituteName: psi.institute_name,
      healthAuthority: psi.health_authority,
      streetAddress: psi.street_address,
      postalCode: psi.postal_code,
      city: psi.city,
    };
  } catch (e) {
    const { response } = e;
    throw new Error(
      response.error || response.statusText || 'Unable to load post secondary institutes'
    );
  }
};

export const fetchCohorts = async ({ psiId }) => {
  try {
    const { data } = await axiosInstance.get(`/psi/${psiId}/cohorts`);

    return data;
  } catch (e) {
    const { response } = e;
    throw new Error(response.error || response.statusText || 'Unable to load cohorts details');
  }
};

export const fetchCohort = async ({ cohortId }) => {
  try {
    const { data } = await axiosInstance.get(`/cohorts/${cohortId}`);

    return data;
  } catch (e) {
    const { response } = e;
    throw new Error(response.error || response.statusText || 'Unable to load cohorts details');
  }
};

export const fetchCohortParticipants = async ({ cohortId }) => {
  try {
    const { data } = await axiosInstance.get(`/cohorts/${cohortId}/participants`);

    return data;
  } catch (e) {
    const { response } = e;
    throw new Error(response.error || response.statusText || 'Unable to load cohort participants');
  }
};

export const addCohort = async ({ psiId, cohort }) => {
  try {
    const { data } = await axiosInstance.post(`/psi/${psiId}/cohorts`, cohort);

    return data;
  } catch (e) {
    const { response } = e;
    throw new Error(`Unable to add cohort for error ${response.error || response.statusText}`);
  }
};

export const editCohort = async ({ cohort, cohortId }) => {
  // Remove id from cohort body
  try {
    const { data } = await axiosInstance.patch(`/cohorts/${cohortId}`, cohort);

    return data;
  } catch (e) {
    const { response } = e;
    throw new Error(`Unable to edit cohort for error: ${response.error || response.statusText}`);
  }
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
    await axiosInstance.post('/psi', psi);

    return [true, null];
  } catch (e) {
    if (e.response.status === 409) {
      try {
        const errorDetails = e.response.data;
        return [
          false,
          errorDetails.error || errorDetails.message || 'Unable to create psi due to server error',
        ];
      } catch {
        return [false, 'Unable to create psi due to server error'];
      }
    }
    return [false, e.response.statusText || 'Unable to create post secondary institute'];
  }
};

export const updatePSI = async ({ id, psi }) => {
  // Decode response
  try {
    await axiosInstance.put(`/psi/${id}`, psi);

    return [true, null];
  } catch (e) {
    return [false, e.response.statusText];
  }
};
