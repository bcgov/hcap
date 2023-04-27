import axios from 'axios';
import store from 'store';

export const axiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL ?? ''}/api/v1`,
});

axiosInstance.interceptors.request.use((config) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const token = store.get('TOKEN');

  if (token) {
    headers.Authorization = `Bearer ${store.get('TOKEN')}`;
  }
  return { ...config, headers };
});
