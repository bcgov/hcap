import React from 'react';
import ReactDOM from 'react-dom';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

import { useToast } from '../../hooks';

export const Alert = (props) => {
  return <MuiAlert elevation={6} variant='filled' {...props} />;
};

export const Toast = () => {
  const {
    closeToast,
    state: { isOpen, status, message },
  } = useToast();
  return ReactDOM.createPortal(
    <Snackbar
      open={isOpen}
      autoHideDuration={6000}
      onClose={(_, reason) => reason !== 'clickaway' && closeToast()}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={closeToast} severity={status}>
        {message}
      </Alert>
    </Snackbar>,
    document.body
  );
};
