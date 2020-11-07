import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useLocation } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import { useKeycloak } from '@react-keycloak/web';
import { Page, } from '../../components/generic';
import { Routes } from '../../constants';
import store from 'store';

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  const [keycloak] = useKeycloak();
  const { state } = useLocation();

  useEffect(() => {
    let idpHint;

    const redirect = state ? state.redirectOnLogin : '/';

    switch (redirect) {
      case Routes.Admin:
      case Routes.EmployeeUpload:
        idpHint = 'idir';
        break;
      default:
        idpHint = 'bceid';
        break;
    }
    store.set('REDIRECT', redirect);
    keycloak.login({ idpHint, redirectUri: `${window.location.origin}${Routes.Keycloak}` });
  }, [keycloak, state]);

  return (
    <Page >
      <Grid container alignItems="center" justify="center" >
        <Typography variant="subtitle2">
          Redirecting...
        </Typography>
      </Grid>
    </Page>
  );
};
