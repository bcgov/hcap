import store from 'store';
import { API_URL } from '../constants';

/**
 *
 * @param {*} response API Request response
 * @param {*} columns Which columns we're expected to map to
 * @returns
 */
const mapPhasesResponse = async (response, columns) => {
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

export const fetchPhases = async (columns) => {
  const response = await fetch(`${API_URL}/api/v1/phase-allocation/`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });
  return mapPhasesResponse(response, columns);
};
