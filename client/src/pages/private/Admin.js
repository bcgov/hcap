import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Page, Button } from '../../components/generic';
import { Routes } from '../../constants';
import store from 'store';
import requirePermissions from './requirePermissions';

export default () => {

  const [roles, setRoles] = useState([]);
  const history = useHistory();

  const fetchRoles = async () => {
    const response = await fetch('/api/v1/roles', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setRoles(roles);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  const renderAdminButton = (key, route, label) => <Box pb={4} pl={4} pr={4} pt={2}>
    <Button
      key={key}
      onClick={async () => {
        history.push(route);
      }}
      variant="contained"
      color="primary"
      fullWidth={false}
      text={label}
    />
  </Box>;

  const renderRoleBasedButtons = (roles) => {
    let buttons = [];
    let uploadApplicants, viewApplicants, viewEEOIs;
    uploadApplicants = viewApplicants = viewEEOIs = false;

    roles.map((item) => {
      switch (item) {
        case 'maximus':
          uploadApplicants = true;
          break;
        case 'employer':
        case 'health_authority':
        case 'ministry_of_health':
          viewApplicants = true;
          viewEEOIs = true;
          break;
        case 'superuser':
          uploadApplicants = true;
          viewApplicants = true;
          viewEEOIs = true;
          break;
        default:
          break;
      }
    });

    if (uploadApplicants) {
      buttons.push(renderAdminButton(0, Routes.ApplicantUpload, 'Upload Applicants'));
    }
    if (viewApplicants) {
      buttons.push(renderAdminButton(1, null, 'View Applicants')); //TODO add route HCAP-166
    }
    if (viewEEOIs) {
      buttons.push(renderAdminButton(2, null, 'View EEOIs')); //TODO add route HCAP-175
    }

    return buttons;
  }

  return (
    <Page component={requirePermissions()}>
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pb={4} pl={4} pr={4} pt={2}>
          <Typography variant="subtitle1" gutterBottom>
            Welcome! You are logged in as the following user types:<br/>
            { roles.join(', ') }
          </Typography>
          {
            renderRoleBasedButtons(roles)
          }
        </Box>
      </Grid>
    </Page>
  );
};
