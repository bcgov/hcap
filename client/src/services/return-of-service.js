import store from 'store';
import dayjs from 'dayjs';
import { API_URL } from '../constants';

export const createReturnOfServiceStatus = async ({
  participantId,
  data,
  siteId,
  newSiteId,
  assignNewSite = false,
}) => {
  const finalBody = {
    ...data,
    employmentType: data.employmentType || undefined,
  };
  if (assignNewSite) {
    finalBody.startDate = dayjs(data.startDate, 'YYYY/MM/DD').toDate();
  } else {
    finalBody.date = dayjs(data.date, 'YYYY/MM/DD').toDate();
  }

  const url = `${API_URL}/api/v1/ros/participant/${participantId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      data: finalBody,
      status: assignNewSite ? 'assigned-new-site' : 'assigned-same-site',
      ...(siteId && { siteId }),
      newSiteId,
      assignNewSite,
    }),
  });
  if (response.ok) {
    return response.json();
  }

  const message = (await response.text()) || 'Failed to create post-hire status';

  throw new Error(message, response.error || response.statusText);
};

export const getAllSites = async () => {
  const url = `${API_URL}/api/v1/employer-sites?all=true`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json();
  } else {
    throw new Error('Failed to fetch all sites');
  }
};

export const updateRosStatus = async (participantId, newValues) => {
  const url = `${API_URL}/api/v1/ros/participant/${participantId}`;
  const { siteName, startDate, date } = newValues;

  if (!siteName && !startDate && !date) {
    throw new Error('Unable  to update the field - no changes found');
  }
  if (!participantId) {
    throw new Error('Unable  to update the field - invalid data');
  }
  const dateTimestamp = date ? dayjs(date, 'YYYY/MM/DD').toDate() : undefined;
  const startDateTimestamp = startDate ? dayjs(startDate, 'YYYY/MM/DD').toDate() : undefined;

  return fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        site: siteName,
        date: dateTimestamp,
        startDate: startDateTimestamp,
      },
    }),
  });
};
