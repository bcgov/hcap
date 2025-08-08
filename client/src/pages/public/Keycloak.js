import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useKeycloak } from '../../providers/KeycloakProvider';
import { Routes } from '../../constants';
import storage from '../../utils/storage';

export default () => {
  const { keycloak, authenticated } = useKeycloak();

  useEffect(() => {
    if (authenticated && keycloak?.token) {
      storage.set('TOKEN', keycloak.token);
    }
  }, [authenticated, keycloak?.token]);

  if (authenticated) {
    return <Navigate to={storage.get('REDIRECT')} replace />;
  }

  if (!authenticated) {
    return <Navigate to={Routes.Login} replace />;
  }

  return 'Authenticating...';
};
