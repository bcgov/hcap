import { axiosInstance } from './api';

export const fetchUserNotifications = async (dispatchFunction) => {
  const { data } = await axiosInstance.get('/user-notifications');

  dispatchFunction(data);
};
