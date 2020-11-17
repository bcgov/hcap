import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { checkPermissions } from '../../utils';

export const CheckPermissions = ({ roles, children }) => {
  return (
    checkPermissions(roles) ?
      {children}
      :
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pb={4} pl={4} pr={4} pt={2}>
          <Typography variant="subtitle1" gutterBottom>
            You don't have enough permissions to access this page.
          </Typography>
        </Box>
      </Grid>
  )
};
