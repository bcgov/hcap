import { API_URL } from '../constants';
import { axiosInstance } from './api';

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

export const fetchPhases = async (queryString = null) => {
  const url = queryString ? `${API_URL}/api/v1/phase${queryString}` : `${API_URL}/api/v1/phase/`;
  const {
    data: { data },
  } = await axiosInstance.get(url);
  return data;
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
  try {
    const {
      data: { data },
    } = await axiosInstance.get(`/phase/${siteId}`);
    return data;
  } catch {
    return [];
  }
};

// Note: This should be converted to ISO, ideally
export const createPhase = async (phaseJson) => {
  await axiosInstance.post('/phase', phaseJson);
};

export const updatePhase = async (phaseId, phaseJson) => {
  await axiosInstance.patch(`/phase/${phaseId}`, phaseJson);
};
