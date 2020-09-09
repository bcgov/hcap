import React, { Suspense, lazy } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { Routes } from '../constants';

const Form = lazy(() => import('../pages/public/Form'));
const Confirmation = lazy(() => import('../pages/public/Confirmation'));

export default () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LinearProgress />}>
        <Switch>
          <Route exact path={Routes.Form} component={Form} />
          <Route exact path={Routes.Confirmation} component={Confirmation} />
          <Route component={Form} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
