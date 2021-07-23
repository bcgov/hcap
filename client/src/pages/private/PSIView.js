import React, { lazy } from 'react';
import { Page, CheckPermissions } from '../../components/generic';
import { Box, Typography } from '@material-ui/core';

const PSITable = lazy(() => import('./PSITable'));

export default () => {
  return (
    <Page>
      <CheckPermissions permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Box pt={4} pb={4} pl={2} pr={2}>
          <Typography variant='subtitle1' gutterBottom>
            Manage Post-Secondary Institutes
          </Typography>
        </Box>
        <PSITable />
      </CheckPermissions>
    </Page>
  );
};
