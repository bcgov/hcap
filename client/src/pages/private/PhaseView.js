import React, { lazy } from 'react';
import { Page, CheckPermissions } from '../../components/generic';
import { Box, Typography, Link } from '@material-ui/core';
import { Routes } from '../../constants';

const PhaseTable = lazy(() => import('./PhaseTable'));

export default () => {
  return (
    <Page>
      <CheckPermissions
        permittedRoles={['health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Box textAlign={0} width={1}>
          <Box py={4} px={2}>
            <Typography variant='body1'>
              <Link href={Routes.SiteView}>View Sites</Link> / <b>Phase list</b>
            </Typography>
            <Box paddingTop={2}>
              <Typography variant='h2' py={2}>
                <b>Phases List</b>
              </Typography>
            </Box>
          </Box>

          <PhaseTable />
        </Box>
      </CheckPermissions>
    </Page>
  );
};
