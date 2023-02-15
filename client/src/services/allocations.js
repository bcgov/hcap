import store from 'store';
import { API_URL } from '../constants';

export const createPhaseAllocation = async (allocationJson) => {
  const response = await fetch(`${API_URL}/api/v1/allocation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(allocationJson),
  });
  return response;
};

export const updatePhaseAllocation = async (allocationId, allocationJson) => {
  const response = await fetch(`${API_URL}/api/v1/allocation/${allocationId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(allocationJson),
  });
  return response;
};
