import React, { Fragment, useMemo } from 'react';
import Grid from '@mui/material/Grid';

import { AuthContext } from '../../providers';
import { Header } from './Header';
import { Footer } from './Footer';
import { Notifications } from './Notifications';
import { Routes } from '../../constants';

// hideEmployers set to true for participant-facing pages
export const Page = ({ children, hideEmployers = false, centered }) => {
  const { auth } = AuthContext.useAuth();
  const notifications = useMemo(() => auth.notifications || [], [auth.notifications]);
  const isEmployerPortal = window.location.host.match(Routes.EmployerHostname);

  return (
    <Fragment>
      <Header hideEmployers={hideEmployers} />
      <Notifications notifications={notifications} />
      <Grid
        container
        sx={{
          minHeight: 'calc(100vh - 124px)',
          justifyContent: centered ? 'center' : 'flex-start',
          alignItems: 'center',
          flexWrap: 'nowrap',
          flexDirection: 'column',
        }}
      >
        {children}
      </Grid>
      {isEmployerPortal && <Footer />}
    </Fragment>
  );
};
