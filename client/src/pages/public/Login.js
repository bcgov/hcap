import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useLocation } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import { useKeycloak } from '@react-keycloak/web';
import { Page } from '../../components/generic';
import { Routes } from '../../constants';
import store from 'store';
import { createCustomLoginUrl } from '../../utils';

export default () => {
  const [keycloak] = useKeycloak();
  const { state } = useLocation();

  useEffect(() => {
    let idpHint;

    const redirect = state ? state.redirectOnLogin : Routes.Admin;
    store.set('REDIRECT', redirect);
    window.location.replace(createCustomLoginUrl(keycloak, Routes.Keycloak, idpHint));
  }, [keycloak, state]);

  return (
    <Page>
      <Grid container alignItems='center' justify='center'>
        <Typography variant='subtitle2'>Redirecting...</Typography>
      </Grid>
    </Page>
  );
};
