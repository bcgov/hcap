import store from 'store';
import { API_URL } from '../constants';

/**
 *
 * @param {*} response API Request response
 * @param {*} columns Which columns we're expected to map to
 * @returns
 */
const mapPhasesResponse = async (data, columns) => {
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
    };
  });
  return rowsData;
};

export const fetchPhases = async () => {
  const response = await fetch(`${API_URL}/api/v1/phase-allocation/`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });

  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw response;
};

export const FetchMappedPhases = async (columns) => {
  try {
    const data = await fetchPhases();
    return mapPhasesResponse(data, columns);
  } catch (error) {
    console.warn('Failed to get phases!', error);
    return [];
  }
};

export const fetchSitePhases = async (siteId) => {
  const response = await fetch(`${API_URL}/api/v1/phase-allocation/${siteId}`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
  if (response.ok) {
    const phases = await response.json();
    return phases.data;
  }
  return [];
};

// Note: This should be converted to ISO, ideally
export const createPhase = async (phaseJson) => {
  const response = await fetch(`${API_URL}/api/v1/phase-allocation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(phaseJson),
  });
  return response;
};

export const updatePhase = async (phaseId, phaseJson) => {
  const response = await fetch(`${API_URL}/api/v1/phase-allocation/${phaseId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(phaseJson),
  });
  return response;
};
