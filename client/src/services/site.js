import store from 'store';
import { API_URL } from '../constants';

export const fetchSite = async (siteId) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/${siteId}`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
  return response;
};

export const fetchRegionSiteRows = async (columns) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/region`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
  return mapSiteRowsResponse(response, columns);
};

export const fetchSiteRows = async (columns) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/user`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
  return mapSiteRowsResponse(response, columns);
};
/**
 *
 * @param {*} response API Request response
 * @param {*} columns Which columns we're expected to map to
 * @returns
 */
const mapSiteRowsResponse = async (response, columns) => {
  if (response.ok) {
    const { data } = await response.json();
    const rowsData = data.map((row) => {
      // Pull all relevant props from row based on columns constant
      const mappedRow = columns.reduce(
        (accumulator, column) => ({
          ...accumulator,
          [column.id]: row[column.id],
        }),
        {}
      );
      // Add additional props (user ID, button) to row
      return {
        ...mappedRow,
        id: row.id,
        allocation: `${row.allocation ?? 0} / ${row.mhawAllocation ?? 0}`,
      };
    });
    return rowsData;
  } else {
    return [];
  }
};

export const createSite = async (siteJson) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(siteJson),
  });
  return response;
};

export const updateSite = async (payload, siteId) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response;
};

export const fetchSiteParticipants = async (columnIDs, siteId) => {
  return fetch(`${API_URL}/api/v1/employer-sites/${siteId}/participants`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
};

export const updateSiteParticipants = async (payload) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/participant_status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Error response:', errorResponse);
  }

  return response;
};
