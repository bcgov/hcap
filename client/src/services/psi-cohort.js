import store from 'store';
import { API_URL } from '../constants';

const baseURL = `${API_URL}/api/v1/psi`;

export const psi = async () => {
  const response = await fetch(`${baseURL}/with-cohorts`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (response.ok) {
    const psiList = (await response.json()) || [];
    return psiList.map((psi) => ({
      ...psi,
      size: psi.cohorts?.reduce((incoming, cohort) => incoming + cohort.cohort_size, 0) || 0,
    }));
  } else {
    throw new Error('Unable to load post secondary institutes');
  }
};
