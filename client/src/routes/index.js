import React, { Suspense, lazy } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { Routes } from '../constants';

const EmployeeForm = lazy(() => import('../pages/public/EmployeeForm'));
const EmployerForm = lazy(() => import('../pages/public/EmployerForm'));
const Login = lazy(() => import('../pages/public/Login'));
const EmployeeConfirmation = lazy(() => import('../pages/public/EmployeeConfirmation'));
const EmployerConfirmation = lazy(() => import('../pages/public/EmployerConfirmation'));

export default () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LinearProgress />}>
        <Switch>
          <Route exact path={Routes.Login} component={Login} />
          <Route exact path={Routes.EmployeeForm} component={EmployeeForm} />
          <Route exact path={Routes.EmployeeConfirmation} component={EmployeeConfirmation} />
          <Route exact path={Routes.EmployerConfirmation} component={EmployerConfirmation} />
          <Route component={EmployerForm} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
