import React from 'react';
import { Box } from '@material-ui/core';

export const Notifications = ({ notifications }) => {
  const formatNotifications = (notifications) => {
    return Object.entries(notifications).map(([type, contents]) => {
      switch (type) {
        case 'rosEndedNotifications':
          return {
            icon: 'warning',
            className: 'warning',
            message: (
              <>
                You have a pending action: <b>{contents.length}</b> of your Return of Service
                Participants have finished their term. Please mark their outcomes.
              </>
            ),
          };
        default:
          return { message: <></>, className: '' };
      }
    });
  };

  return (
    <Box>
      {formatNotifications(notifications).map((notification) => {
        return (
          <div key={notification.icon}>
            <div className={notification.className}>{notification.message}</div>
          </div>
        );
      })}
    </Box>
  );
};
