import { axiosInstance } from './api';

export const createAllocation = async (payload) => {
  const { data } = await axiosInstance.post('/allocation', payload);
  return data;
};

export const updateAllocation = async (allocationId, payload) => {
  const { data } = await axiosInstance.patch(`/allocation/${allocationId}`, payload);
  return data;
};

export const bulkAllocation = async (payload) => {
  const { data } = await axiosInstance.post('/allocation/bulk-allocation', payload);
  return data;
};
