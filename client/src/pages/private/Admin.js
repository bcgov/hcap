import React, { useEffect, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import { Page, Button, CheckPermissions } from '../../components/generic';
import { Role, Routes, UserRoles } from '../../constants';
import { AuthContext } from '../../providers';

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: theme.spacing(3),
  },
  welcomeOverflow: {
    maxWidth: '320px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

export default () => {
  const history = useHistory();
  const classes = useStyles();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const name = auth.user?.name || '';

  useEffect(() => {
    if (roles.includes(Role.Employer) || roles.includes(Role.MHSUEmployer))
      history.push(Routes.ParticipantView);
  }, [roles, history]);

  const renderAdminButton = (route, label) => (
    <Button
      className={classes.button}
      onClick={async () => {
        history.push(route);
      }}
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
          justify='center'
          alignItems='center'
          direction='column'
        >
          <Box pb={4} pl={4} pr={4} pt={2}>
            <Grid container direction='column'>
              <Typography
                noWrap
                variant='subtitle1'
                gutterBottom
                className={classes.welcomeOverflow}
              >
                Welcome, {name}
              </Typography>
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
