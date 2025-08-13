import React, { lazy, useState } from 'react';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import { Page, CheckPermissions, CustomTab, CustomTabs } from '../../components/generic';
import { AuthContext, ParticipantsContext } from '../../providers';
import { Role, UserRoles } from '../../constants';

const ParticipantTable = lazy(() => import('./ParticipantTable'));
const SiteTable = lazy(() => import('./SiteTable'));

const ScrollableContainer = styled(Grid)({
  overflowX: 'scroll',
});

export default () => {
  const [tabValue, setTabValue] = useState(0);
  const { auth } = AuthContext.useAuth();
  const sites = auth.user?.sites || [];
  const roles = auth.user?.roles || [];

  const handleTabChange = (_, newTabValue) => {
    setTabValue(newTabValue);
  };

  return (
    <Page>
      <CheckPermissions permittedRoles={UserRoles} renderErrorMessage={true}>
        <Grid container justify='flex-start' alignItems='flex-start' direction='row'>
          <CustomTabs value={tabValue} onChange={handleTabChange} aria-label='tabs'>
            <CustomTab label='Participants' id='participantsTab' key='participants' />
            {(roles.includes(Role.Employer) ||
              roles.includes(Role.MHSUEmployer) ||
              roles.includes(Role.HealthAuthority)) && (
              <CustomTab label='My Sites' id='sitesTab' key='sites' />
            )}
          </CustomTabs>
        </Grid>

        <ScrollableContainer container alignItems='center' justify='flex-start' direction='column'>
          {tabValue === 0 && (
            <ParticipantsContext.ParticipantsProvider role={auth.permissionRole}>
              <ParticipantTable />
            </ParticipantsContext.ParticipantsProvider>
          )}

          {tabValue === 1 && <SiteTable sites={sites} />}
        </ScrollableContainer>
      </CheckPermissions>
    </Page>
  );
};
