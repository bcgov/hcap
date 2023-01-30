import React, { Suspense, lazy, useEffect, useState } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { useKeycloak, KeycloakProvider } from '@react-keycloak/web';
import store from 'store';
import Keycloak from 'keycloak-js';

import { API_URL, Routes } from '../constants';
import { AuthContext } from '../providers';
import PhaseView from '../pages/private/PhaseView';
const ParticipantLogin = lazy(() => import('../pages/public/ParticipantLogin'));
const Admin = lazy(() => import('../pages/private/Admin'));
const UserView = lazy(() => import('../pages/private/UserView'));
const ParticipantView = lazy(() => import('../pages/private/ParticipantView'));
const SiteView = lazy(() => import('../pages/private/SiteView'));
const SiteViewDetails = lazy(() => import('../pages/private/SiteViewDetails'));
const PSIView = lazy(() => import('../pages/private/PSIView'));
const PSIViewDetails = lazy(() => import('../pages/private/PSIViewDetails'));
const CohortDetails = lazy(() => import('../pages/private/CohortDetails'));
const EOIView = lazy(() => import('../pages/private/EOIView'));
const EOIViewDetails = lazy(() => import('../pages/private/EOIViewDetails'));
const ReportingView = lazy(() => import('../pages/private/ReportingView'));
const ParticipantForm = lazy(() => import('../pages/public/ParticipantForm'));
const Login = lazy(() => import('../pages/public/Login'));
const ParticipantConfirmation = lazy(() => import('../pages/public/ParticipantConfirmation'));
const EmployerConfirmation = lazy(() => import('../pages/public/EmployerConfirmation'));
const KeycloakRedirect = lazy(() => import('../pages/public/Keycloak'));
const ConfirmInterest = lazy(() => import('../pages/public/ConfirmInterest'));
const ParticipantLanding = lazy(() => import('../pages/private/ParticipantLanding'));
const ParticipantEOI = lazy(() => import('../pages/private/ParticipantEOI'));
const ParticipantEOIEdit = lazy(() => import('../pages/private/ParticipantEOI'));
const ParticipantWithdrawConfirm = lazy(() =>
  import('../pages/private/ParticipantWithdrawConfirm')
);
const ParticipantFullWithdraw = lazy(() => import('../pages/private/ParticipantFullWithdrawPage'));
const ParticipantActionSuccess = lazy(() => import('../pages/private/ParticipantActionSuccess'));

const ParticipantDetails = lazy(() => import('../pages/private/ParticipantDetailsView'));

const EmployerLogin = lazy(() => import('../pages/public/EmployerLogin'));

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
    // Saving all received env variables to store
    if (result.envVariables && Object.keys(result.envVariables).length > 0) {
      for (const key of Object.keys(result.envVariables)) {
        store.set(key, result.envVariables[key]);
      }
    }
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
            <PrivateRoute
              exact
              path={Routes.ParticipantActionSuccess}
              component={ParticipantActionSuccess}
            />
            <PrivateRoute exact path={Routes.ParticipantLanding} component={ParticipantLanding} />
            <PrivateRoute exact path={Routes.ParticipantEOI} component={ParticipantEOI} />
            <PrivateRoute exact path={Routes.ParticipantEOIEdit} component={ParticipantEOIEdit} />
            <PrivateRoute
              exact
              path={Routes.ParticipantWithdrawConfirm}
              component={ParticipantWithdrawConfirm}
            />
            <PrivateRoute
              exact
              path={Routes.ParticipantFullWithdraw}
              component={ParticipantFullWithdraw}
            />
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
            <PrivateRoute exact path={Routes.PSIView} component={PSIView} />
            <PrivateRoute exact path={Routes.PSIViewDetails} component={PSIViewDetails} />
            <PrivateRoute exact path={Routes.CohortDetails} component={CohortDetails} />
            <PrivateRoute exact path={Routes.EOIView} component={EOIView} />
            <PrivateRoute exact path={Routes.EOIViewDetails} component={EOIViewDetails} />
            <PrivateRoute exact path={Routes.ParticipantView} component={ParticipantView} />
            <PrivateRoute exact path={Routes.ParticipantDetails} component={ParticipantDetails} />
            <PrivateRoute exact path={Routes.PhaseView} component={PhaseView} />
            {/**
             * Adding this to support internal tab selection in global navigation
             */}
            <PrivateRoute
              exact
              path={Routes.ParticipantDetailsTab}
              component={ParticipantDetails}
            />
            <Route exact path={Routes.Base} component={EmployerLogin} />
            <Redirect to={Routes.Base} />
          </RootUrlSwitch>
        </Suspense>
      </BrowserRouter>
    </KeycloakProvider>
  );
};
