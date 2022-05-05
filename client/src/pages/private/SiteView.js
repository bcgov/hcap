import React, { lazy } from 'react';
import { Page, CheckPermissions } from '../../components/generic';
import { Box, Typography } from '@material-ui/core';

const SiteTable = lazy(() => import('./SiteTable'));

export default () => {
  return (
    <Page>
      <CheckPermissions
        permittedRoles={['health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Box py={4} px={2}>
          <Typography variant='h3' gutterBottom>
            View Sites
          </Typography>
        </Box>

        <SiteTable />
      </CheckPermissions>
    </Page>
  );
};
