import React from 'react';
import { Box } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import { capitalizedString } from '../../utils';

// style guide: https://developer.gov.bc.ca/Design-System/Alert-Banners
const useStyles = makeStyles((theme) => ({
  alert: {
    fontSize: '16px',
    border: '1px solid',
    fontWeight: 'bold',
  },
  alertWarning: {
    color: theme.palette.warning.main,
    backgroundColor: theme.palette.warning.light,
    borderColor: theme.palette.warning.border,
  },
}));

const severityPriority = { error: 0, warning: 1, info: 2, success: 3 };

export const Notifications = ({ notifications }) => {
  const classes = useStyles();

  if (!notifications.length > 0) {
    return null;
  }

  // isolate a notification with the highest priority available to display
  const displayedNotification = notifications.sort((a, b) => {
    return severityPriority[a.severity] - severityPriority[b.severity];
  })[0];

  const alertSeverityClass = `alert${capitalizedString(displayedNotification.severity)}`;

  return (
    <Box m={1}>
      <MuiAlert
        className={`${classes.alert} ${classes[alertSeverityClass]}`}
        severity={displayedNotification.severity}
      >
        {displayedNotification.message}
      </MuiAlert>
    </Box>
  );
};
