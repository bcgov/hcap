import React, { Fragment, useState } from 'react';

export const ToastProviderContext = React.createContext({});
export const ToastProvider = ({ children }) => {
  const [state, setState] = useState({
    isOpen: false,
    status: '',
    message: '',
  });

  const showToast = (payload) => setState(prevState => ({ ...prevState, ...payload, isOpen: true }));
  const hideToast = () => setState(prevState => ({ ...prevState, isOpen: false }));

  const contextValue = {
    showToast,
    hideToast,
    state,
  };

  return (
    <ToastProviderContext.Provider value={contextValue}>
      <Fragment>
        {children}
      </Fragment>
    </ToastProviderContext.Provider>
  );
};
