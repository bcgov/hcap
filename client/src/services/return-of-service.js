import store from 'store';
import dayjs from 'dayjs';
import { API_URL } from '../constants';

export const createReturnOfServiceStatus = async ({ participantId, data }) => {
  // Covert data into date obj
  const dateObj = dayjs(data.date, 'YYYY/MM/DD').toDate();
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
    }),
  });
  if (response.ok) {
    return await response.json();
  }

  const message = (await response.text()) || 'Failed to create post-hire status';

  throw new Error(message, response.error || response.statusText);
};
