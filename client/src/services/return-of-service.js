import dayjs from 'dayjs';
import { axiosInstance } from './api';

export const createReturnOfServiceStatus = async ({ participantId, data, siteId }) => {
  const finalBody = {
    ...data,
    employmentType: data.employmentType || undefined,
    date: dayjs(data.date, 'YYYY/MM/DD').toDate(),
  };

  const payload = {
    data: finalBody,
    status: 'assigned-same-site',
    ...(siteId && { siteId }),
  };
  try {
    const { data } = await axiosInstance.post(`/ros/participant/${participantId}`, payload);

    return data;
  } catch (e) {
    const { response } = e;
    const message = (await response.text()) || 'Failed to create post-hire status';
    throw new Error(message, response.error || response.statusText);
  }
};

export const getAllSites = async () => {
  try {
    const { data } = await axiosInstance.get('/employer-sites');
    return data;
  } catch {
    throw new Error('Failed to fetch all sites');
  }
};

export const updateRosStatus = async (participantId, newValues, status) => {
  let url = `/ros/participant/${participantId}`;
  if (status) {
    url += '/change-site';
  }
  const { site, startDate, date, employmentType, positionType } = newValues;

  if (!site && !startDate && !date) {
    throw new Error('Unable  to update the field - no changes found');
  }
  if (!participantId) {
    throw new Error('Unable  to update the field - invalid data');
  }
  const dateTimestamp = date ? dayjs(date, 'YYYY/MM/DD').toDate() : undefined;
  const startDateTimestamp = startDate ? dayjs(startDate, 'YYYY/MM/DD').toDate() : undefined;

  const data = {
    site,
    date: dateTimestamp,
    startDate: startDateTimestamp,
    employmentType,
    positionType,
    status,
  };

  return axiosInstance.patch(url, { data });
};
