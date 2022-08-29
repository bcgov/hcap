import store from 'store';
import { API_URL } from '../constants';

export const fetchSitePhases = async (siteId) => {
  console.log('hi tara from fetch site phases!');
  const response = await fetch(`${API_URL}/api/v1/phase-allocation/${siteId}`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
  let phases = [];
  if (response.ok) {
    phases = await response.json();
  }
  return phases;
};

export const fetchSiteRows = async (columns) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
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
      };
    });
    return rowsData;
  } else {
    return [];
  }
};

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
