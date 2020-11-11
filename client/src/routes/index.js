import React, { Suspense, lazy, useEffect, useState, } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { useKeycloak, KeycloakProvider } from '@react-keycloak/web';
import store from 'store';
import Keycloak from 'keycloak-js';

import { Routes } from '../constants';

const EmployeeUpload = lazy(() => import('../pages/private/EmployeeUpload'));
const EmployeeForm = lazy(() => import('../pages/public/EmployeeForm'));
const EmployerForm = lazy(() => import('../pages/public/EmployerForm'));
const Login = lazy(() => import('../pages/public/Login'));
const EmployeeConfirmation = lazy(() => import('../pages/public/EmployeeConfirmation'));
const EmployerConfirmation = lazy(() => import('../pages/public/EmployerConfirmation'));
const KeycloackRedirect = lazy(() => import('../pages/public/Keycloak'));

const PrivateRoute = ({ component: Component, path, ...rest }) => {
  const [keycloak] = useKeycloak();
  return (
    <Route
      path={path}
      {...rest}
      render={props =>
        keycloak.authenticated && !keycloak.loginRequired ?
          <Component {...props} />
          :
          <Redirect
            to={{
              pathname: Routes.Login,
              state: { redirectOnLogin: path }
            }} />
      }
    />
  );
};

export default () => {

  const [keycloakInfo, setKeycloakInfo] = useState();

  const getKeycloakInfo = async () => {
    const response = await fetch('/api/v1/keycloak-realm-client-info', {
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      method: 'GET',
    });

    const result = await response.json();

    setKeycloakInfo(new Keycloak({
      realm: result.realm,
      url: result.url,
      clientId: result.clientId
    }))
  };

  useEffect(() => {
    getKeycloakInfo();
  }, []);

  if (!keycloakInfo) {
    return null;
  }

  return (
    <KeycloakProvider
      keycloak={keycloakInfo}
      autoRefreshToken={true}
      initConfig={{
        pkceMethod: 'S256',
        checkLoginIframe: false,
      }}
      onTokens={() => {
        store.set('TOKEN', keycloakInfo.token);
      }}
      LoadingComponent={<LinearProgress />}
    >
      <BrowserRouter>
        <Suspense fallback={<LinearProgress />}>
          <Switch>
            <Route exact path={Routes.Login} component={Login} />
            <Route exact path={Routes.EmployerForm} component={EmployerForm} />
            <Route exact path={Routes.EmployeeForm} component={EmployeeForm} />
            <Route exact path={Routes.EmployeeConfirmation} component={EmployeeConfirmation} />
            <Route exact path={Routes.EmployerConfirmation} component={EmployerConfirmation} />
            <PrivateRoute exact path={Routes.EmployeeUpload} component={EmployeeUpload} />
            <Route exact path={Routes.Keycloak} component={KeycloackRedirect} />
            <Route component={EmployerForm} />
          </Switch>
        </Suspense>
      </BrowserRouter>
    </KeycloakProvider>
  );
};
