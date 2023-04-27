import { ToastStatus } from '../constants';

export const getErrorMessage = (e, msg) => {
  let message = e.response.error || e.response?.statusText || msg || 'Server error';
  return { status: ToastStatus.Error, message };
};
