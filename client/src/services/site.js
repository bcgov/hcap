import store from 'store';
import { API_URL, ToastStatus } from '../constants';

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

export const createPhase = async (phase) => {
  let toast;
  const phaseJson = {
    name: phase.phaseName,
    start_date: phase.startDate,
    end_date: phase.endDate,
  };
  const response = await fetch(`${API_URL}/api/v1/phase-allocation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(phaseJson),
  });

  if (response.ok) {
    toast = {
      status: ToastStatus.Success,
      message: `Phase '${phase.phaseName}' added successfully`,
    };
  } else {
    toast = {
      status: ToastStatus.Error,
      message: response.error || response.statusText || 'Server error',
    };
  }
  return { ok: response.ok, toast };
};

export const createSite = async (site) => {
  let toast;
  const siteJson = {
    ...site,
    siteId: parseInt(site.siteId),
    allocation: parseInt(site.allocation),
  };
  const response = await fetch(`${API_URL}/api/v1/employer-sites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(siteJson),
  });

  if (response.ok) {
    toast = {
      status: ToastStatus.Success,
      message: `Site '${site.siteName}' added successfully`,
    };
  } else {
    const error = await response.json();
    if (error.status && error.status === 'Duplicate') {
      toast = { status: ToastStatus.Error, message: 'Duplicate site ID' };
    } else {
      toast = {
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      };
    }
  }
  return { ok: response.ok, toast };
};
