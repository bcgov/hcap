import React, { Suspense, lazy } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { Routes } from '../constants';

const EmployerLanding = lazy(() => import('../pages/public/EmployerLanding'));
const Form = lazy(() => import('../pages/public/Form'));
const Login = lazy(() => import('../pages/public/Login'));
const Confirmation = lazy(() => import('../pages/public/Confirmation'));

export default () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LinearProgress />}>
        <Switch>
          <Route exact path={Routes.EmployerLanding} component={EmployerLanding} />
          <Route exact path={Routes.Login} component={Login} />
          <Route exact path={Routes.Form} component={Form} />
          <Route exact path={Routes.Confirmation} component={Confirmation} />
          <Route component={EmployerLanding} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
