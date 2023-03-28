import store from 'store';
import { API_URL } from '../constants';
import { handleReportDownloadResult } from '../utils';

const reportTitleHash = {
  ros: 'return-of-service-milestones-',
  hired: 'participant-stats-hired-',
  participants: 'participants-attending-psi-',
};

export const fetchMilestoneReports = async () => {
  const response = await fetch(`${API_URL}/api/v1/milestone-report`, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    return response.json();
  } else {
    throw new Error('Failed to fetch milestone reports');
  }
};

export const downloadReport = async (reportType) => {
  const url = `${API_URL}/api/v1/milestone-report/csv/${reportType}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    const downloadRes = await handleReportDownloadResult(
      response,
      `${reportTitleHash[reportType]}${new Date().toJSON()}.csv`
    );
    return downloadRes;
  } else {
    throw new Error('Failed to download report');
  }
};
