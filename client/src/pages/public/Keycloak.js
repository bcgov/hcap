import React, { useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import store from 'store';

export default function KeycloakRedirect () {
  const [keycloak] = useKeycloak();
  useEffect(() => {
    if (keycloak.authenticated) {
      store.set('TOKEN', keycloak.token)
    }
  }, []);
  return keycloak.authenticated
    ?
      <Redirect to='/admin' />
    :
      keycloak.loginRequired
    ?
      <Redirect to='/login' />
    :
      <h4>Authenticating...</h4>
}