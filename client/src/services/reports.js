import store from 'store';
import { API_URL } from '../constants';
import { handleReportDownloadResult } from '../utils';
import { axiosInstance } from './api';

const reportTitleHash = {
  ros: 'return-of-service-milestones-',
  hired: 'participant-stats-hired-',
  psi: 'participants-attending-psi-',
};

const reportURLHash = {
  ros: 'milestone-report/csv/ros',
  hired: 'milestone-report/csv/hired',
  psi: 'psi-report/csv/participants',
};

const csvTitle = (reportType, region = null) => {
  if (region && reportType === 'hired')
    return `${reportTitleHash[reportType]}${region}-${new Date().toJSON()}.csv`;
  return `${reportTitleHash[reportType]}${new Date().toJSON()}.csv`;
};
export const fetchMilestoneReports = async () => {
  try {
    const { data } = await axiosInstance.get('/milestone-report');

    return data;
  } catch {
    throw new Error('Failed to fetch milestone reports');
  }
};

export const downloadMilestoneReports = async (reportType, region = null) => {
  const url = region
    ? `${API_URL}/api/v1/${reportURLHash[reportType]}/${region}`
    : `${API_URL}/api/v1/${reportURLHash[reportType]}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    await handleReportDownloadResult(response, csvTitle(reportType, region));
    return response;
  } else {
    throw new Error('Failed to download report');
  }
};

export const downloadPSIReports = async (reportType) => {
  const url = `${API_URL}/api/v1/${reportURLHash[reportType]}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    await handleReportDownloadResult(response, csvTitle(reportType));
    return response;
  } else {
    throw new Error('Failed to download report');
  }
};
