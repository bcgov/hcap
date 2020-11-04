import React, { Suspense, lazy } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { useKeycloak, KeycloakProvider } from '@react-keycloak/web';
import store from 'store';

import keycloak from '../keycloak';
import { Routes } from '../constants';

const Admin = lazy(() => import('../pages/private/Admin'));
const EmployeeForm = lazy(() => import('../pages/public/EmployeeForm'));
const EmployerForm = lazy(() => import('../pages/public/EmployerForm'));
const Login = lazy(() => import('../pages/public/Login'));
const EmployeeConfirmation = lazy(() => import('../pages/public/EmployeeConfirmation'));
const EmployerConfirmation = lazy(() => import('../pages/public/EmployerConfirmation'));
const KeycloackRedirect = lazy(() => import('../pages/public/Keycloak'));

const PrivateRoute = ({ component: Component, ...rest }) => {
  const [keycloak] = useKeycloak();
  return (
    <Route
      {...rest}
      render={props =>
        keycloak.authenticated && !keycloak.loginRequired ? <Component {...props} /> : <Redirect to='/login' />
      }
    />
  );
};

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  return (
    <KeycloakProvider
      keycloak={keycloak}
      autoRefreshToken={true}
      initConfig={{
        pkceMethod: 'S256',
      }}
      onTokens={() => {
        store.set('TOKEN', keycloak.token);
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
            <PrivateRoute exact path={Routes.Admin} component={Admin} />
            <Route exact path={Routes.Keycloak} component={KeycloackRedirect} />
            <Route component={EmployerForm} />
          </Switch>
        </Suspense>
      </BrowserRouter>
    </KeycloakProvider>
  );
}
