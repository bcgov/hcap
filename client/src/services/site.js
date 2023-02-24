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
  const response = await fetch(`${API_URL}/api/v1/employer-sites/${siteId}/participants`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });

  if (response.ok) {
    const { hired, withdrawn } = await response.json();
    const hiredParticipants = mapSiteParticipantsDataToRow(hired, columnIDs);
    const withdrawnParticipants = mapSiteParticipantsDataToRow(withdrawn, columnIDs);
    return { hiredParticipants, withdrawnParticipants };
  } else {
    return { hiredParticipants: [], withdrawnParticipants: [] };
  }
};

/**
 * Takes the data from the db and formats it for the table
 * @param {*} response: raw data from API call
 * @returns
 */
const mapSiteParticipantsDataToRow = (response, columnIDs) => {
  return response.map((row) => {
    // Pull all relevant props from row based on columns constant
    const values = {
      participantId: row.participant_id,
      participantName: `${row.participantJoin.body.firstName} ${row.participantJoin.body.lastName}`,
      hiredDate: row.data.hiredDate,
      startDate: row.data.startDate,
      withdrawnDate: row.data.endDate,
      reason: row.data.reason,
      nonHCAP: row.data.nonHcapOpportunity ? 'Non-HCAP' : 'HCAP',
    };

    const mappedRow = columnIDs.reduce(
      (accumulator, column) => ({
        ...accumulator,
        [column.id]: values[column.id],
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
