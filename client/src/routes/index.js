import React, { Suspense, lazy } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { Routes } from '../constants';

const EmployerLanding = lazy(() => import('../pages/public/EmployerLanding'));
const EmployeeForm = lazy(() => import('../pages/public/EmployeeForm'));
const EmployerForm = lazy(() => import('../pages/public/EmployerForm'));
const Login = lazy(() => import('../pages/public/Login'));
const EmployeeConfirmation = lazy(() => import('../pages/public/EmployeeConfirmation'));

export default () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LinearProgress />}>
        <Switch>
          <Route exact path={Routes.EmployerLanding} component={EmployerLanding} />
          <Route exact path={Routes.Login} component={Login} />
          <Route exact path={Routes.EmployerForm} component={EmployerForm} />
          <Route exact path={Routes.EmployeeForm} component={EmployeeForm} />
          <Route exact path={Routes.EmployeeConfirmation} component={EmployeeConfirmation} />
          <Route component={EmployerLanding} />
          {/* Remove after default route is defined <Route component={Form} /> */}
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
