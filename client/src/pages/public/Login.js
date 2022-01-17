import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { useLocation } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { useKeycloak } from '@react-keycloak/web';
import { Page } from '../../components/generic';
import { Routes } from '../../constants';
import store from 'store';

export default () => {
  const [keycloak] = useKeycloak();
  const { state } = useLocation();

  useEffect(() => {
    let idpHint;

    const redirect = state ? state.redirectOnLogin : Routes.Admin;

    switch (redirect) {
      case Routes.ParticipantUpload:
        idpHint = 'bceid';
        break;
      default:
        break;
    }
    store.set('REDIRECT', redirect);
    keycloak.login({ idpHint, redirectUri: `${window.location.origin}${Routes.Keycloak}` });
  }, [keycloak, state]);

  return (
    <Page>
      <Grid container alignItems='center' justifyContent='center'>
        <Typography variant='subtitle2'>Redirecting...</Typography>
      </Grid>
    </Page>
  );
};
