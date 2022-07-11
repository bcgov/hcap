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
  // Covert data into date obj
  const siteDate = data.date || data.startDate;
  const dateObj = dayjs(siteDate, 'YYYY/MM/DD').toDate();
  const finalBody = {
    ...data,
    date: dateObj,
    employmentType: data.employmentType || undefined,
  };
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
