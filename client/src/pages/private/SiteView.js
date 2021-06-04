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
        <Box pt={4} pb={4} pl={2} pr={2}>
          <Typography variant='subtitle1' gutterBottom>
            Sites
          </Typography>
        </Box>
        <SiteTable sites={[]} />
      </CheckPermissions>
    </Page>
  );
};
