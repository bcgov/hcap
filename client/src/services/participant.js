import { postHireStatuses } from '../constants';
import { axiosInstance } from './api';

export const getCohortPsiName = (cohort = {}) =>
  cohort?.cohort_name && cohort.psi?.institute_name
    ? `${cohort.cohort_name} / ${cohort.psi?.institute_name}`
    : 'Not Assigned';

export const getPostHireStatusLabel = ({ status, data = {} } = {}) => {
  switch (status) {
    case postHireStatuses.postSecondaryEducationCompleted:
      return `Graduation Completed on - ${data.graduationDate}`;
    case postHireStatuses.cohortUnsuccessful:
      return `Unsuccessful/incomplete course - ${data.unsuccessfulCohortDate}`;
    default:
      return `Not recorded`;
  }
};

export const getGraduationStatus = (statuses = []) => {
  // I changed the logic here to only consider the most recent status
  // We might wish to reevaluate this column. We may wish to provide more detailed status tracking here.
  const switchValue = statuses[0]?.status || '';
  switch (switchValue) {
    case postHireStatuses.postSecondaryEducationCompleted:
      return 'Yes ✓';
    default:
      return 'No';
  }
};
// determine which status to display, If 'hired' exists, show hired status and siteName, else show the first status
const getDefaultStatusAndSite = (statusArr) => {
  if (!statusArr.length) return { status: 'available', siteName: null };
  if (statusArr.length) {
    const [hired] = statusArr.filter((status) => status.status === 'hired');
    if (hired) return { status: hired.status, siteName: hired.siteName };
    return { status: statusArr[0].status, siteName: null };
  }
};

// Fetch Participant
export const fetchParticipant = async ({ id }) => {
  try {
    const { data } = await axiosInstance.get(`/participant/details/${id}`);

    const { participant } = data;
    const cohort = await fetchParticipantCohort({ id });
    const postHireStatus = await fetchParticipantPostHireStatus({ id });

    return {
      ...participant,
      cohort,
      cohortName: getCohortPsiName(cohort),
      postHireStatus,
      postHireStatusLabel: getPostHireStatusLabel(postHireStatus),
      ...getDefaultStatusAndSite(participant.latestStatuses),
    };
  } catch {
    throw new Error('Unable to load participant');
  }
};

export const fetchParticipantById = async (participantId) => {
  try {
    const { data } = await axiosInstance.get(`/participant?id=${participantId}`);
    return data;
  } catch {
    throw new Error('Unable to load participant');
  }
};

export const fetchParticipantPostHireStatus = async ({ id }) => {
  try {
    const { data } = await axiosInstance.get(`/post-hire-status/participant/${id}`);

    // Return latest status which is the first element in the array
    return data[0];
  } catch {
    throw new Error(`Unable to fetch participant's post hire status`);
  }
};

export const fetchParticipantCohort = async ({ id }) => {
  try {
    const { data } = await axiosInstance.get(`/cohorts/assigned-participant/${id}`);

    return data;
  } catch {
    throw new Error(`Unable to fetch participant's cohorts details`);
  }
};

// Update participant
export const updateParticipant = async (values, participant) => {
  if (values.phoneNumber && Number.isInteger(values.phoneNumber))
    values.phoneNumber = values.phoneNumber.toString();
  if (values.postalCode && values.postalCode.length > 3) {
    values.postalCodeFsa = values.postalCode.slice(0, 3);
  }
  const history = {
    timestamp: new Date(),
    changes: [],
  };
  Object.keys(values).forEach((key) => {
    if (values[key] !== participant[key]) {
      history.changes.push({
        field: key,
        from: participant[key],
        to: values[key],
      });
    }
  });
  values.history = participant.history ? [history, ...participant.history] : [history];

  try {
    const { data } = await axiosInstance.patch(`/participant`, values);
    return data;
  } catch (e) {
    throw new Error('Unable to update participant', {
      status: e.response.status,
      statusText: e.response.statusText,
      cause: e.response.statusText,
    });
  }
};

export const getParticipants = async ({
  pagination,
  filter,
  order,
  siteSelector,
  selectedTabStatuses,
}) => {
  const params = new URLSearchParams();
  params.append('offset', pagination.page * pagination.pageSize);
  params.append('pageSize', pagination.pageSize);
  params.append('sortField', order.field);
  params.append('sortDirection', order.direction);

  Object.entries(filter).forEach(([key, value]) => {
    value.value && params.append(key, value.value);
  });

  siteSelector && params.append('siteSelector', siteSelector);

  selectedTabStatuses.forEach((status) => {
    params.append('statusFilters[]', status);
  });

  try {
    const { data } = await axiosInstance.get(`/participants?${params.toString()}`);

    return data;
  } catch {
    throw new Error('Failed to fetch participants');
  }
};

export const addParticipantStatus = async ({ participantId, status, additional }) => {
  const { sites = [], currentStatusId, ...rest } = additional;
  const [siteObj] = sites;
  const site = siteObj;

  try {
    const payload = { participantId, status, data: rest, site, currentStatusId };
    const { data } = await axiosInstance.post('/employer-actions', payload);

    return data;
  } catch (e) {
    const { response } = e;
    if (e.status === 400) {
      // Try
      try {
        let errorMessage = '';
        if (response.headers.get('content-type').includes('application/json')) {
          const error = response.data || { message: 'Unknown error' };
          errorMessage = error.message;
        } else {
          errorMessage = `Failed to add participant status due to server error: ${await response.text()}`;
        }
        throw new Error(errorMessage);
      } catch (error) {
        // Non json response from server
        throw new Error(`Failed to add participant status: ${error.message}`);
      }
    }
    throw new Error('Failed to add participant status', response.error || response.statusText);
  }
};

export const acknowledgeParticipant = async ({ participantId, multiOrgHire, currentStatusId }) => {
  try {
    const payload = { participantId, multiOrgHire, currentStatusId };
    const { data } = await axiosInstance.delete('/employer-actions/acknowledgment', payload);

    return {
      ...data,
      success: true,
    };
  } catch (e) {
    const { response } = e;
    if (response.status === 400) {
      return {
        ...response.data,
        success: false,
      };
    }
    throw new Error('Failed to acknowledge participant', response.error || response.statusText);
  }
};

export const createPostHireStatus = async ({ participantIds, status, data }) => {
  try {
    const payload = { participantIds, status, data };

    const res = await axiosInstance.post('/post-hire-status', payload);
    return res.data;
  } catch (e) {
    const { response } = e;
    throw new Error('Failed to create post-hire status', response.error || response.statusText);
  }
};

export const archiveParticipant = async (participantId, siteId, additional) => {
  try {
    const payload = {
      participantId,
      site: siteId,
      data: additional,
      status: 'archived',
    };

    const { data } = await axiosInstance.post('/employer-actions/archive', payload);
    return data;
  } catch (e) {
    const { response } = e;
    throw new Error('Failed to archive participant', response.error || response.statusText);
  }
};
