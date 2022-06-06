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
  const formatNotifications = (notifications) => {
    return Object.entries(notifications).map(([type, contents]) => {
      switch (type) {
        case 'rosEndedNotifications':
          return {
            severity: 'warning',
            type: type,
            className: classes.alertWarning,
            message: (
              <>
                You have a pending action: <strong>{contents.length}</strong> of your Return of
                Service Participants have finished their term. Please mark their outcomes.
              </>
            ),
          };
        default:
          return { message: <></>, severity: '' };
      }
    });
  };

  return (
    <Box m={1}>
      {formatNotifications(notifications).map((notification) => {
        return (
          <MuiAlert
            className={notification.className}
            severity={notification.severity}
            key={notification.type}
          >
            {notification.message}
          </MuiAlert>
        );
      })}
    </Box>
  );
};
