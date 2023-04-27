import React, { lazy } from 'react';
import { Page, CheckPermissions } from '../../components/generic';
import { Box, Typography } from '@material-ui/core';
import { Role } from '../../constants';

const SiteTable = lazy(() => import('./SiteTable'));

export default () => {
  return (
    <Page>
      <CheckPermissions
        permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}
        renderErrorMessage={true}
      >
        <Box py={4} px={2}>
          <Typography variant='subtitle1' gutterBottom>
            View Sites
          </Typography>
        </Box>

        <SiteTable />
      </CheckPermissions>
    </Page>
  );
};
