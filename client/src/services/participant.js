import store from 'store';
import { API_URL, pageSize } from '../constants';

const getCohortName = (cohort = {}) =>
  cohort.cohort_name && cohort.psi?.institute_name
    ? `${cohort.cohort_name} / ${cohort.psi?.institute_name}`
    : 'Not Assigned';

// Fetch Participant
export const fetchParticipant = async ({ id }) => {
  const url = `${API_URL}/api/v1/participant?id=${id}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (resp.ok) {
    const [participant] = await resp.json();
    const cohort = await fetchParticipantCohort({ id });
    return {
      ...participant,
      cohort,
      cohortName: getCohortName(cohort),
    };
  } else {
    throw new Error('Unable to load participant');
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

  params.append('offset', pagination.page * pageSize);
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
  const response = await fetch(`${API_URL}/api/v1/employer-actions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ participantId, status, data: additional }),
  });

  if (response.ok) {
    return response.json();
  }

  throw new Error('Failed to add participant status', response.error || response.statusText);
};
