import storage from '../utils/storage';
import { API_URL } from '../constants';

export const fetchUserNotifications = async (dispatchFunction) => {
  const response = await fetch(`${API_URL}/api/v1/user-notifications`, {
    headers: {
      Authorization: `Bearer ${storage.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    const notifications = await response.json();
    dispatchFunction(notifications);
  }
  return response;
};
