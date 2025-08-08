import React from 'react';
import ReactDOM from 'react-dom';
import Snackbar from '@mui/material/Snackbar';
import { Alert as MuiAlert } from '@mui/material';

import { useToast } from '../../hooks';

export const Alert = (props) => {
  return <MuiAlert elevation={6} variant='filled' {...props} />;
};

// no-transition component to avoid DOM measurement issues
const NoTransition = React.forwardRef(
  ({ children, in: inProp, appear, onEnter, onExited, ...other }, ref) => {
    // Filter out transition-specific props that React doesn't recognize
    return inProp ? (
      <div ref={ref} {...other}>
        {children}
      </div>
    ) : null;
  },
);

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
      disableWindowBlurListener={true}
      TransitionComponent={NoTransition}
    >
      <Alert onClose={closeToast} severity={status}>
        {message}
      </Alert>
    </Snackbar>,
    document.body,
  );
};
