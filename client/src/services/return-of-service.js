import store from 'store';
import dayjs from 'dayjs';
import { API_URL } from '../constants';

export const createReturnOfServiceStatus = async ({
  participantId,
  data,
  siteId,
  newSiteId,
  isUpdating = false,
}) => {
  const finalBody = {
    ...data,
    employmentType: data.employmentType || undefined,
  };
  if (isUpdating) {
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
      status: isUpdating ? 'assigned-new-site' : 'assigned-same-site',
      ...(siteId && { siteId }),
      newSiteId,
      isUpdating,
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

export const onRosSiteUpdate = async (participantId, newSiteId) => {
  if (!participantId || !newSiteId) {
    throw new Error('Unable  to update the field - invalid data');
  }
};

export const onRosDateUpdate = async (participantId, newDate) => {
  if (!participantId || !newDate) {
    throw new Error('Unable  to update the field - invalid data');
  }
  const dateTimestamp = dayjs(newDate, 'YYYY/MM/DD').toDate();
};

export const onRosStartDateUpdate = async (participantId, newStartDate) => {
  if (!participantId || !newStartDate) {
    throw new Error('Unable  to update the field - invalid data');
  }
  const dateTimestamp = dayjs(newStartDate, 'YYYY/MM/DD').toDate();
};
