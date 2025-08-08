import React from 'react';
import { Box, Alert as MuiAlert } from '@mui/material';

const severityPriority = { error: 0, warning: 1, info: 2, success: 3 };

export const Notifications = ({ notifications }) => {
  if (!notifications.length > 0) {
    return null;
  }

  // isolate a notification with the highest priority available to display
  const displayedNotification = notifications.sort((a, b) => {
    return severityPriority[a.severity] - severityPriority[b.severity];
  })[0];

  const isWarning = displayedNotification.severity === 'warning';

  return (
    <Box m={1}>
      <MuiAlert
        sx={{
          fontSize: '16px',
          border: '1px solid',
          fontWeight: 'bold',
          ...(isWarning && {
            color: 'warning.main',
            backgroundColor: 'warning.light',
            borderColor: 'warning.border',
          }),
        }}
        severity={displayedNotification.severity}
      >
        {displayedNotification.message}
      </MuiAlert>
    </Box>
  );
};
