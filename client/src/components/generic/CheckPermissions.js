import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { checkPermissions, checkPending } from '../../utils';

export const CheckPermissions = ({ isLoading, roles, permittedRoles, children, renderErrorMessage = false }) => {
  const isPending = checkPending(roles);
  if (isLoading) {
    return null;
  }

  // If user has a permitted role assigned, grant access to components
  if (checkPermissions(roles, permittedRoles)) {
    return children;
  }

  const pendingMessage = <Fragment>
    <p>Thank you for logging in. Your access request is being reviewed.</p>
    <p>Please note that your access will only be granted if you have approved allocations under HCAP.</p>
  </Fragment>;

  const message = isPending ? pendingMessage : <p>You don't have permission to view this content.</p>;

  // Optional: display message if no access granted by role(s)
  if (renderErrorMessage) {
    return (
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pb={4} pl={4} pr={4} pt={2}>
          <Typography variant="subtitle1" gutterBottom>
            { message }
          </Typography>
        </Box>
      </Grid>
    );
  }

  // Default: return nothing if no access granted by role(s)
  return null;
};
