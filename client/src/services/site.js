import { axiosInstance } from './api';

export const fetchSite = async (siteId) => {
  const { data } = await axiosInstance.get(`/employer-sites/${siteId}`);
  return data;
};

export const fetchRegionSiteRows = async (columns) => {
  const {
    data: { data },
  } = await axiosInstance.get('/employer-sites/region');
  return mapSiteRowsResponse(data, columns);
};

export const fetchSiteRows = async (columns) => {
  const {
    data: { data },
  } = await axiosInstance.get('/employer-sites/user');
  return mapSiteRowsResponse(data, columns);
};
/**
 *
 * @param {*} data list of sites
 * @param {*} columns Which columns we're expected to map to
 * @returns
 */
const mapSiteRowsResponse = async (data, columns) => {
  return data.map((row) => {
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
};

export const createSite = async (siteJson) => {
  return axiosInstance.post('/employer-sites', siteJson);
};

export const updateSite = async (payload, siteId) => {
  return axiosInstance.patch(`/employer-sites/${siteId}`, payload);
};

export const fetchSiteParticipants = async (columnIDs, siteId) => {
  const { data } = await axiosInstance.get(`/employer-sites/${siteId}/participants`);
  return data;
};
