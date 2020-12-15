import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import { Page, Button, CheckPermissions } from '../../components/generic';
import { Routes } from '../../constants';
import store from 'store';

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: theme.spacing(3),
  },
}));

export default () => {

  const [roles, setRoles] = useState([]);
  const [name, setName] = useState([]);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const history = useHistory();
  const classes = useStyles();

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    const response = await fetch('/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles, name } = await response.json();
      setLoadingUser(false);
      setRoles(roles);
      setName(name);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const renderAdminButton = (route, label) => <Button
    className={classes.button}
    onClick={async () => {
      history.push(route);
    }}
    variant="contained"
    color="primary"
    fullWidth={false}
    text={label}
  />;

  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['maximus', 'employer', 'health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pb={4} pl={4} pr={4} pt={2}>
            <Grid container direction="column">
              <Typography variant="subtitle1" gutterBottom>
                Welcome, {name}
              </Typography>
              <CheckPermissions roles={roles} permittedRoles={['maximus']}>
                { renderAdminButton(Routes.ParticipantUpload, 'Upload Participants') }
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['employer', 'health_authority', 'ministry_of_health']}>
                { renderAdminButton(Routes.ParticipantView, 'View Participants') }
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['health_authority', 'ministry_of_health']}>
                { renderAdminButton(Routes.EOIView, 'View Employers') }
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
                { renderAdminButton(Routes.UserView, 'View Access Requests') }
              </CheckPermissions>
            </Grid>
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
