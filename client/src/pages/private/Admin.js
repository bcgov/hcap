import React, { useEffect, useMemo } from 'react';
import { Grid, Box, Typography, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Page, Button, CheckPermissions } from '../../components/generic';
import { Role, Routes, UserRoles } from '../../constants';
import { AuthContext } from '../../providers';

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const WelcomeText = styled(Typography)({
  maxWidth: '320px',
  textAlign: 'center',
});

export default () => {
  const navigate = useNavigate();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const name = auth.user?.name || auth.user?.username || '';

  useEffect(() => {
    if (roles.includes(Role.Employer) || roles.includes(Role.MHSUEmployer)) {
      navigate(Routes.ParticipantView);
    }
  }, [roles, navigate]);

  const renderAdminButton = (route, label) => (
    <StyledButton
      onClick={() => navigate(route)}
      variant='contained'
      color='primary'
      fullWidth={false}
      text={label}
    />
  );

  return (
    <Page centered>
      <CheckPermissions permittedRoles={[Role.Maximus, ...UserRoles]} renderErrorMessage={true}>
        <Grid
          container
          alignContent='center'
          justifyContent='center'
          alignItems='center'
          direction='column'
        >
          <Box pb={4} pl={4} pr={4} pt={2}>
            <Grid container direction='column'>
              <WelcomeText variant='subtitle1' gutterBottom>
                Welcome, {name}
              </WelcomeText>
              <CheckPermissions permittedRoles={UserRoles}>
                {renderAdminButton(Routes.ParticipantView, 'View Participants')}
              </CheckPermissions>
              <CheckPermissions permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}>
                {renderAdminButton(Routes.EOIView, 'View Employer EOIs')}
              </CheckPermissions>
              <CheckPermissions permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}>
                {renderAdminButton(Routes.SiteView, 'View Sites')}
              </CheckPermissions>
              <CheckPermissions permittedRoles={[Role.MinistryOfHealth]}>
                {renderAdminButton(Routes.UserPending, 'View Access Requests')}
              </CheckPermissions>
              <CheckPermissions permittedRoles={[Role.MinistryOfHealth]}>
                {renderAdminButton(Routes.UserEdit, 'Manage Users')}
              </CheckPermissions>
              <CheckPermissions permittedRoles={[Role.MinistryOfHealth, Role.HealthAuthority]}>
                {renderAdminButton(Routes.ReportingView, 'Reporting')}
              </CheckPermissions>
              <CheckPermissions permittedRoles={[Role.MinistryOfHealth, Role.HealthAuthority]}>
                {renderAdminButton(Routes.PSIView, 'Manage PSI')}
              </CheckPermissions>
            </Grid>
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
