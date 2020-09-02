import React, { Suspense, lazy, useEffect, useState } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import { Routes } from '../constants';
import { verifyJWT } from '../utils';

const Form = lazy(() => import('../pages/public/Form'));
const Confirmation = lazy(() => import('../pages/public/Confirmation'));
const Login = lazy(() => import('../pages/public/Login'));
const Submissions = lazy(() => import('../pages/private/Submissions'));
const SubmissionDetails = lazy(() => import('../pages/private/SubmissionDetails'));

const PrivateGuard = ({ component: Component, ...rest }) => {
  const [isValid, setValidity] = useState(null);

  useEffect(() => {
    (async () => {
      const jwt = window.localStorage.getItem('jwt');
      if (!jwt) setValidity(false);
      else setValidity(await verifyJWT(jwt));
    })();
  }, []);

  return isValid === null ? <LinearProgress /> : (
    <Route {...rest} render={(props) => (
      isValid
        ? <Component {...props} />
        : <Redirect to={Routes.Login} />
    )}
    />
  );
};

const PublicGuard = ({ component: Component, ...rest }) => {
  const [isValid, setValidity] = useState(null);

  useEffect(() => {
    (async () => {
      const jwt = window.localStorage.getItem('jwt');
      if (!jwt) setValidity(false);
      else setValidity(await verifyJWT(jwt));
    })();
  }, []);

  return isValid === null ? <LinearProgress /> : (
    <Route {...rest} render={(props) => (
      isValid
        ? <Redirect to={Routes.Submissions} />
        : <Component {...props} />
    )}
    />
  );
};

export default () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LinearProgress />}>
        <Switch>
          <PublicGuard exact path={Routes.Form} component={Form} />
          <PublicGuard exact path={Routes.Confirmation} component={Confirmation} />
          <PublicGuard exact path={Routes.Login} component={Login} />
          <PrivateGuard exact path={Routes.Submissions} component={Submissions} />
          <PrivateGuard exact path={Routes.SubmissionDetails.staticRoute} component={SubmissionDetails} />
          <Route component={Form} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
