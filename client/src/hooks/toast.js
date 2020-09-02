import { useContext } from 'react';

import { ToastProviderContext } from '../providers';

export const useToast = () => {
  const { showToast, hideToast, state } = useContext(ToastProviderContext);

  const openToast = (payload) => showToast(payload);
  const closeToast = () => hideToast();

  return { openToast, closeToast, state };
};
