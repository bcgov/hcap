import store from 'store';
import { API_URL, postHireStatuses } from '../constants';
import { fetchSite } from './site';

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

// Fetch Participant
export const fetchParticipant = async ({ id }) => {
  const url = `${API_URL}/api/v1/participant/details/${id}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (resp.ok) {
    const { participant } = await resp.json();
    const cohort = await fetchParticipantCohort({ id });
    const postHireStatus = await fetchParticipantPostHireStatus({ id });
    const status = participant.latestStatuses.length
      ? participant.latestStatuses[0].status
      : 'available';
    // NOTE: ideally there should be a role check here! Otherwise employers will just make requests that will never work.
    // Unfortunately, that would probably mean untangling a lot of how roles are handled.
    let site = null;
    if (status === 'hired') {
      const siteRes = await fetchSite(participant.latestStatuses[0].siteId);
      // Check for valid response before parsing
      if (siteRes.ok) site = await siteRes.json();
    }
    return {
      ...participant,
      cohort,
      cohortName: getCohortPsiName(cohort),
      postHireStatus,
      postHireStatusLabel: getPostHireStatusLabel(postHireStatus),
      status,
      siteName: site ? site.siteName : null,
    };
  } else {
    throw new Error('Unable to load participant');
  }
};

export const fetchParticipantById = async (participantId) => {
  const url = `${API_URL}/api/v1/participant?id=${participantId}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });
  if (response.ok) {
    return response.json();
  } else {
    throw new Error('Unable to load participant');
  }
};

export const fetchParticipantPostHireStatus = async ({ id }) => {
  const url = `${API_URL}/api/v1/post-hire-status/participant/${id}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (resp.ok) {
    const statuses = await resp.json();
    // Return latest status which is the first element in the array
    return statuses[0];
  } else {
    throw new Error(`Unable to fetch participant's post hire status`);
  }
};

export const fetchParticipantCohort = async ({ id }) => {
  const url = `${API_URL}/api/v1/cohorts/assigned-participant/${id}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (resp.ok) {
    return await resp.json();
  } else {
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
  const response = await fetch(`${API_URL}/api/v1/participant`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(values),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Unable to update participant', {
      status: response.status,
      statusText: response.statusText,
      cause: response.statusText,
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
  const response = await fetch(`${API_URL}/api/v1/participants?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    return response.json();
  }

  throw new Error('Failed to fetch participants');
};

export const addParticipantStatus = async ({ participantId, status, additional }) => {
  const { sites = [], currentStatusId, ...rest } = additional;
  const [siteObj] = sites;
  const site = siteObj;
  const response = await fetch(`${API_URL}/api/v1/employer-actions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ participantId, status, data: rest, site, currentStatusId }),
  });

  if (response.ok) {
    return response.json();
  }

  if (response.status === 400) {
    // Try
    try {
      let errorMessage = '';
      if (response.headers.get('content-type').includes('application/json')) {
        const error = (await response.json()) || { message: 'Unknown error' };
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
};

export const acknowledgeParticipant = async ({ participantId, multiOrgHire, currentStatusId }) => {
  const response = await fetch(`${API_URL}/api/v1/employer-actions/acknowledgment`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ participantId, multiOrgHire, currentStatusId }),
  });

  if (response.ok) {
    return {
      ...(await response.json()),
      success: true,
    };
  }
  if (response.status === 400) {
    return {
      ...(await response.json()),
      success: false,
    };
  }

  throw new Error('Failed to acknowledge participant', response.error || response.statusText);
};

export const createPostHireStatus = async ({ participantIds, status, data }) => {
  const url = `${API_URL}/api/v1/post-hire-status`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      participantIds,
      status,
      data,
    }),
  });
  if (response.ok) {
    return await response.json();
  }

  throw new Error('Failed to create post-hire status', response.error || response.statusText);
};

export const archiveParticipant = async (participantId, siteId, additional) => {
  const url = `${API_URL}/api/v1/employer-actions/archive`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      participantId,
      site: siteId,
      data: additional,
      status: 'archived',
    }),
  });

  if (response.ok) {
    return response;
  }

  throw new Error('Failed to archive participant', response.error || response.statusText);
};
