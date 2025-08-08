import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { useLocation } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { useKeycloak } from '../../providers/KeycloakProvider';
import { Page } from '../../components/generic';
import { Routes } from '../../constants';
import storage from '../../utils/storage';
import { createCustomLoginUrl } from '../../utils';

export default () => {
  console.log('Login component mounted');
  const { keycloak, loading } = useKeycloak();
  const { state } = useLocation();

  useEffect(() => {
    console.log('Login useEffect triggered:', {
      loading,
      keycloak: !!keycloak,
      hasCreateLoginUrl: keycloak?.createLoginUrl,
    });

    if (!loading && keycloak && keycloak.createLoginUrl) {
      const performRedirect = async () => {
        try {
          console.log('Creating login URL...');
          const redirect = state ? state.redirectOnLogin : Routes.Admin;
          storage.set('REDIRECT', redirect);
          const loginUrl = await createCustomLoginUrl(keycloak, Routes.Keycloak);
          console.log('Login URL created:', loginUrl);
          window.location.replace(loginUrl);
        } catch (error) {
          console.error('Failed to create login URL:', error);
          // Fallback: redirect to simple Keycloak login
          if (keycloak.login) {
            console.log('Using fallback keycloak.login()');
            keycloak.login();
          }
        }
      };

      performRedirect();
    } else {
      console.log('Not ready for redirect:', {
        loading,
        hasKeycloak: !!keycloak,
        hasCreateLoginUrl: keycloak?.createLoginUrl,
      });
    }
  }, [keycloak, loading, state]);

  if (loading) {
    return (
      <Page>
        <Grid container alignItems='center' justify='center'>
          <Typography variant='subtitle2'>Initializing authentication...</Typography>
        </Grid>
      </Page>
    );
  }

  return (
    <Page>
      <Grid container alignItems='center' justify='center'>
        <Typography variant='subtitle2'>Redirecting...</Typography>
      </Grid>
    </Page>
  );
};
