import React, { Fragment, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

import { AuthContext } from '../../providers';
import { Header } from './Header';
import { Footer } from './Footer';
import { Notifications } from './Notifications';
import { Routes } from '../../constants';

const useStyles = makeStyles(() => ({
  root: (props) => ({
    minHeight: 'calc(100vh - 124px)',
    justifyContent: props.centered ? 'center' : 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'column',
  }),
}));

// hideEmployers set to true for participant-facing pages
export const Page = ({ children, hideEmployers = false, centered }) => {
  const classes = useStyles({ centered });

  const { auth } = AuthContext.useAuth();
  const notifications = useMemo(() => auth.notifications || [], [auth.notifications]);
  const isEmployerPortal = window.location.host.match(Routes.EmployerHostname);

  return (
    <Fragment>
      <Header hideEmployers={hideEmployers} />
      <Notifications notifications={notifications} />
      <Grid className={classes.root} container>
        {children}
      </Grid>
      {isEmployerPortal && <Footer />}
    </Fragment>
  );
};
