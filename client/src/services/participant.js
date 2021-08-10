import store from 'store';
import { API_URL } from '../constants';

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
    return participant;
  } else {
    throw new Error('Unable to load participant');
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
