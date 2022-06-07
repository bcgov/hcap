import React from 'react';
import { Box } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  alertWarning: {
    fontSize: '16px',
    color: '#6c4a00',
    backgroundColor: '#f9f1c6',
    border: '1px solid #faebcc',
  },
}));

export const Notifications = ({ notifications }) => {
  const classes = useStyles();

  return (
    Object.keys(notifications).length > 0 && (
      <Box m={1}>
        {notifications.rosEndedNotifications && (
          <MuiAlert className={classes.alertWarning} severity='warning'>
            You have a pending action: <strong>{notifications.rosEndedNotifications.length}</strong>{' '}
            of your Return of Service Participants have finished their term. Please mark their
            outcomes.
          </MuiAlert>
        )}
      </Box>
    )
  );
};
