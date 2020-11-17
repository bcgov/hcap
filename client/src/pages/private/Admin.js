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
  const history = useHistory();
  const classes = useStyles();

  const fetchUserInfo = async () => {
    const response = await fetch('/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles, name } = await response.json();
      setRoles(roles);
      setName(name);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const renderAdminButton = (key, route, label) => <Button
    key={key}
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
    <Page >
      <CheckPermissions roles={roles} permittedRoles={['maximus', 'employer', 'health_authority', 'ministry_of_health']} renderMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pb={4} pl={4} pr={4} pt={2}>
            <Grid container direction="column">
              <Typography variant="subtitle1" gutterBottom>
                Welcome, {name}
              </Typography>
              <CheckPermissions roles={roles} permittedRoles={['maximus']}>
                { renderAdminButton(0, Routes.ApplicantUpload, 'Upload Applicants') }
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['employer', 'health_authority', 'ministry_of_health']}>
                { renderAdminButton(1, null, 'View Applicants') } {/* TODO add route HCAP-166 */}
              </CheckPermissions>
              <CheckPermissions roles={roles} permittedRoles={['employer', 'health_authority', 'ministry_of_health']}>
                { renderAdminButton(2, Routes.EOIView, 'View Employers') }
              </CheckPermissions>
            </Grid>
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
