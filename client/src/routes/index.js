import React, { Suspense, lazy, useEffect, useState } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { useKeycloak, KeycloakProvider } from '@react-keycloak/web';
import store from 'store';
import Keycloak from 'keycloak-js';

import { API_URL, Routes } from '../constants';
import { AuthContext } from '../providers';
const ParticipantLogin = lazy(() => import('../pages/public/ParticipantLogin'));
const Admin = lazy(() => import('../pages/private/Admin'));
const UserView = lazy(() => import('../pages/private/UserView'));
const ParticipantView = lazy(() => import('../pages/private/ParticipantView'));
const SiteView = lazy(() => import('../pages/private/SiteView'));
const SiteViewDetails = lazy(() => import('../pages/private/SiteViewDetails'));
const EOIView = lazy(() => import('../pages/private/EOIView'));
const EOIViewDetails = lazy(() => import('../pages/private/EOIViewDetails'));
const ParticipantUpload = lazy(() => import('../pages/private/ParticipantUpload'));
const ParticipantUploadResults = lazy(() => import('../pages/private/ParticipantUploadResults'));
const ReportingView = lazy(() => import('../pages/private/ReportingView'));
const ParticipantForm = lazy(() => import('../pages/public/ParticipantForm'));
const EmployerForm = lazy(() => import('../pages/public/EmployerForm'));
const Login = lazy(() => import('../pages/public/Login'));
const ParticipantConfirmation = lazy(() => import('../pages/public/ParticipantConfirmation'));
const EmployerConfirmation = lazy(() => import('../pages/public/EmployerConfirmation'));
const KeycloakRedirect = lazy(() => import('../pages/public/Keycloak'));
const ConfirmInterest = lazy(() => import('../pages/public/ConfirmInterest'));
const ParticipantLanding = lazy(() => import('../pages/private/ParticipantLanding'));

const PrivateRoute = ({ component: Component, path, ...rest }) => {
  const [keycloak] = useKeycloak();
  return (
    <Route
      path={path}
      {...rest}
      render={(props) =>
        keycloak.authenticated && !keycloak.loginRequired ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: Routes.Login,
              state: { redirectOnLogin: path },
            }}
          />
        )
      }
    />
  );
};

// This function will either return a Switch for its child components or
// nothing, depending on whether the hostname matches the passed regex
const RootUrlSwitch = ({ rootUrlRegExp, children }) =>
  rootUrlRegExp.test(window.location.hostname) && <Switch>{children}</Switch>;

export default () => {
  const [keycloakInfo, setKeycloakInfo] = useState();
  const { dispatch } = AuthContext.useAuth();

  const getUserInfo = async (token) => {
    dispatch({ action: AuthContext.USER_LOADING });
    const response = await fetch(`${API_URL}/api/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'GET',
    });
    if (response.ok) {
      dispatch({ type: AuthContext.USER_LOADED, payload: await response.json() });
    } else {
      // logout, remove token if it's invalid
      dispatch({ type: AuthContext.USER_LOADED, payload: null });
      store.remove('TOKEN');
      await keycloakInfo.logout({ redirectUri: window.location.origin });
    }
  };
  const getKeycloakInfo = async () => {
    const response = await fetch(`${API_URL}/api/v1/keycloak-realm-client-info`, {
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      method: 'GET',
    });

    const result = await response.json();
    setKeycloakInfo(
      new Keycloak({
        realm: result.realm,
        url: result.url,
        clientId: result.clientId,
      })
    );
  };

  useEffect(() => {
    getKeycloakInfo();
  }, []);

  if (!keycloakInfo) {
    return 'Server unavailable';
  }

  const handleTokens = (tokens) => {
    store.set('TOKEN', tokens.token);
    getUserInfo(tokens.token);
  };

  return (
    <KeycloakProvider
      keycloak={keycloakInfo}
      autoRefreshToken={true}
      initConfig={{
        pkceMethod: 'S256',
        checkLoginIframe: false,
      }}
      onTokens={handleTokens}
      LoadingComponent={<LinearProgress />}
    >
      <BrowserRouter>
        <Suspense fallback={<LinearProgress />}>
          <RootUrlSwitch rootUrlRegExp={Routes.ParticipantHostname}>
            <Route
              exact
              path={Routes.ParticipantConfirmation}
              component={ParticipantConfirmation}
            />
            <Route exact path={Routes.Login} component={ParticipantLogin} />
            <Route exact path={Routes.Base} component={ParticipantForm} />
            <Route exact path={Routes.ParticipantForm} component={ParticipantForm} />
            <Route exact path={Routes.ConfirmInterest} component={ConfirmInterest} />
            <PrivateRoute exact path={Routes.ParticipantLanding} component={ParticipantLanding} />
            <Redirect to={Routes.Base} />
          </RootUrlSwitch>
          <RootUrlSwitch rootUrlRegExp={Routes.EmployerHostname}>
            <Route exact path={Routes.Login} component={Login} />
            <Route exact path={Routes.Keycloak} component={KeycloakRedirect} />
            <PrivateRoute exact path={Routes.Admin} component={Admin} />
            <Route exact path={Routes.EmployerConfirmation} component={EmployerConfirmation} />
            <PrivateRoute exact path={Routes.UserPending} component={UserView} />
            <PrivateRoute exact path={Routes.UserEdit} component={UserView} />
            <PrivateRoute exact path={Routes.ReportingView} component={ReportingView} />
            <PrivateRoute exact path={Routes.SiteView} component={SiteView} />
            <PrivateRoute exact path={Routes.SiteViewDetails} component={SiteViewDetails} />
            <PrivateRoute exact path={Routes.EOIView} component={EOIView} />
            <PrivateRoute exact path={Routes.EOIViewDetails} component={EOIViewDetails} />
            <PrivateRoute exact path={Routes.ParticipantView} component={ParticipantView} />
            <PrivateRoute exact path={Routes.ParticipantUpload} component={ParticipantUpload} />
            <PrivateRoute
              exact
              path={Routes.ParticipantUploadResults}
              component={ParticipantUploadResults}
            />
            <Route exact path={Routes.Base} component={EmployerForm} />
            <Redirect to={Routes.Base} />
          </RootUrlSwitch>
        </Suspense>
      </BrowserRouter>
    </KeycloakProvider>
  );
};
