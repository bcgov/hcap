import store from 'store';
import { API_URL } from '../constants';

export const createAllocation = async (payload) => {
  const response = await fetch(`${API_URL}/api/v1/allocation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response;
};

export const updateAllocation = async (allocationId, payload) => {
  const response = await fetch(`${API_URL}/api/v1/allocation/${allocationId}`, {
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

export const bulkAllocation = async (payload) => {
  const response = await fetch(`${API_URL}/api/v1/allocation/bulk-allocation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response;
};
