import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { checkPermissions } from '../../utils';

export const CheckPermissions = ({ isLoading, roles, permittedRoles, children, renderErrorMessage = false }) => {

  if (isLoading) {
    return null;
  }

  // If user has a permitted role assigned, grant access to components
  if (checkPermissions(roles, permittedRoles)) {
    return children;
  }

  // Optional: display message if no access granted by role(s)
  if (renderErrorMessage) {
    return (
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pb={4} pl={4} pr={4} pt={2}>
          <Typography variant="subtitle1" gutterBottom>
            You don't have permission to view this content.
          </Typography>
        </Box>
      </Grid>
    );
  }

  // Default: return nothing if no access granted by role(s)
  return null;
};
