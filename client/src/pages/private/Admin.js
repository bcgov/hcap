import React, { useEffect, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import { Page, Button, CheckPermissions } from '../../components/generic';
import { Routes } from '../../constants';
import { AuthContext } from '../../providers';

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: theme.spacing(3),
  },
}));

export default () => {
  const history = useHistory();
  const classes = useStyles();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const name = auth.user?.name || '';

  useEffect(() => {
    if (roles.includes('employer')) history.push(Routes.ParticipantView);
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
    <Page>
      <CheckPermissions
        roles={roles}
        permittedRoles={['maximus', 'employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Grid
          container
          alignContent='center'
          justify='center'
          alignItems='center'
          direction='column'
        >
          <Box pb={4} pl={4} pr={4} pt={2}>
            <Grid container direction='column'>
              <Typography variant='subtitle1' gutterBottom>
                Welcome, {name}
              </Typography>
              <CheckPermissions roles={roles} permittedRoles={['maximus']}>
                {renderAdminButton(Routes.ParticipantUpload, 'Upload Participants')}
              </CheckPermissions>
              <CheckPermissions
                roles={roles}
                permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
              >
                {renderAdminButton(Routes.ParticipantView, 'View Participants')}
              </CheckPermissions>
              <CheckPermissions
                roles={roles}
                permittedRoles={['health_authority', 'ministry_of_health']}
              >
                {renderAdminButton(Routes.EOIView, 'View Employer EOIs')}
              </CheckPermissions>
              <CheckPermissions
                roles={roles}
                permittedRoles={['health_authority', 'ministry_of_health']}
              >
                {renderAdminButton(Routes.SiteView, 'View Sites')}
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
                {renderAdminButton(Routes.UserPending, 'View Access Requests')}
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
                {renderAdminButton(Routes.UserEdit, 'Manage Users')}
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
                {renderAdminButton(Routes.ReportingView, 'View Milestone Reports')}
              </CheckPermissions>
            </Grid>
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
