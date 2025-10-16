import React, { Suspense, lazy } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { BrowserRouter, Route, Navigate, Routes as RouterRoutes } from 'react-router-dom';
import { useKeycloak, KeycloakProvider } from '../providers/KeycloakProvider';
import storage from '../utils/storage';

import { Routes } from '../constants';
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
const ParticipantWithdrawConfirm = lazy(
  () => import('../pages/private/ParticipantWithdrawConfirm'),
);
const ParticipantFullWithdraw = lazy(() => import('../pages/private/ParticipantFullWithdrawPage'));
const ParticipantActionSuccess = lazy(() => import('../pages/private/ParticipantActionSuccess'));

const ParticipantDetails = lazy(() => import('../pages/private/ParticipantDetailsView'));

const EmployerLogin = lazy(() => import('../pages/public/EmployerLogin'));
// const EmployerForm = lazy(() => import('../pages/public/EmployerForm'));

const PrivateRoute = ({ component: Component }) => {
  const { authenticated, loading } = useKeycloak();

  if (loading) {
    return <LinearProgress />;
  }

  if (!authenticated) {
    return <Navigate to={Routes.Login} replace />;
  }

  return <Component />;
};

// This function will either return a Routes for its child components or
// nothing, depending on whether the hostname matches the passed regex
const RootUrlSwitch = ({ rootUrlRegExp, children }) => {
  const hostname = window.location.hostname;
  const matches = rootUrlRegExp.test(hostname);
  return matches ? <RouterRoutes>{children}</RouterRoutes> : null;
};

export default () => {
  const handleTokens = (tokens) => {
    storage.set('TOKEN', tokens.token);
  };

  return (
    <KeycloakProvider onTokens={handleTokens}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<LinearProgress />}>
          <RootUrlSwitch rootUrlRegExp={Routes.ParticipantHostname}>
            <Route path={Routes.ParticipantConfirmation} element={<ParticipantConfirmation />} />
            <Route path={Routes.Login} element={<ParticipantLogin />} />
            <Route path={Routes.Base} element={<ParticipantForm />} />
            <Route path={Routes.ParticipantForm} element={<ParticipantForm />} />
            <Route path={Routes.ConfirmInterest} element={<ConfirmInterest />} />
            <Route
              path={Routes.ParticipantActionSuccess}
              element={<PrivateRoute component={ParticipantActionSuccess} />}
            />
            <Route
              path={Routes.ParticipantLanding}
              element={<PrivateRoute component={ParticipantLanding} />}
            />
            <Route
              path={Routes.ParticipantEOI}
              element={<PrivateRoute component={ParticipantEOI} />}
            />
            <Route
              path={Routes.ParticipantEOIEdit}
              element={<PrivateRoute component={ParticipantEOIEdit} />}
            />
            <Route
              path={Routes.ParticipantWithdrawConfirm}
              element={<PrivateRoute component={ParticipantWithdrawConfirm} />}
            />
            <Route
              path={Routes.ParticipantFullWithdraw}
              element={<PrivateRoute component={ParticipantFullWithdraw} />}
            />
            <Route path='*' element={<Navigate to={Routes.Base} replace />} />
          </RootUrlSwitch>
          <RootUrlSwitch rootUrlRegExp={Routes.EmployerHostname}>
            <Route path={Routes.Login} element={<Login />} />
            <Route path={Routes.Keycloak} element={<KeycloakRedirect />} />
            <Route path={Routes.Admin} element={<PrivateRoute component={Admin} />} />
            <Route path={Routes.EmployerConfirmation} element={<EmployerConfirmation />} />
            <Route path={Routes.UserPending} element={<PrivateRoute component={UserView} />} />
            <Route path={Routes.UserEdit} element={<PrivateRoute component={UserView} />} />
            <Route
              path={Routes.ReportingView}
              element={<PrivateRoute component={ReportingView} />}
            />
            <Route path={Routes.SiteView} element={<PrivateRoute component={SiteView} />} />
            <Route
              path={Routes.SiteViewDetails}
              element={<PrivateRoute component={SiteViewDetails} />}
            />
            <Route path={Routes.PSIView} element={<PrivateRoute component={PSIView} />} />
            <Route
              path={Routes.PSIViewDetails}
              element={<PrivateRoute component={PSIViewDetails} />}
            />
            <Route
              path={Routes.CohortDetails}
              element={<PrivateRoute component={CohortDetails} />}
            />
            <Route path={Routes.EOIView} element={<PrivateRoute component={EOIView} />} />
            <Route
              path={Routes.EOIViewDetails}
              element={<PrivateRoute component={EOIViewDetails} />}
            />
            <Route
              path={Routes.ParticipantView}
              element={<PrivateRoute component={ParticipantView} />}
            />
            <Route
              path={Routes.ParticipantDetails}
              element={<PrivateRoute component={ParticipantDetails} />}
            />
            <Route path={Routes.PhaseView} element={<PrivateRoute component={PhaseView} />} />
            {/**
             * Adding this to support internal tab selection in global navigation
             */}
            <Route
              path={Routes.ParticipantDetailsTab}
              element={<PrivateRoute component={ParticipantDetails} />}
            />
            {/* <Route path="/employer-form" element={<EmployerForm />} /> */}
            <Route path={Routes.Base} element={<EmployerLogin />} />
            <Route path='*' element={<Navigate to={Routes.Base} replace />} />
          </RootUrlSwitch>
        </Suspense>
      </BrowserRouter>
    </KeycloakProvider>
  );
};
