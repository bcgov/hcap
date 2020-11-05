import React, { useEffect } from 'react';
import { Redirect, } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import { Routes } from '../../constants';
import store from 'store';

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  const [keycloak] = useKeycloak();

  useEffect(() => {
    if (keycloak.authenticated) {
      store.set('TOKEN', keycloak.token);
    }
  }, [keycloak.authenticated, keycloak.token]);


  return keycloak.authenticated
    ?
    <Redirect to={store.get('REDIRECT')} />
    :
    keycloak.loginRequired
      ?
      <Redirect to={Routes.Login} />
      :
      'Authenticating...';
};