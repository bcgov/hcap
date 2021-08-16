import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

import { Header } from './Header';

const useStyles = makeStyles(() => ({
  root: (props) => ({
    height: 'calc(100vh - 82px)',
    justifyContent: props.centered ? 'center' : 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'column',
  }),
  autoHeight: (props) => ({
    height: 'auto',
    justifyContent: props.centered ? 'center' : 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'column',
  }),
}));

// hideEmployers set to true for participant-facing pages
export const Page = ({ children, hideEmployers = false, centered, isAutoHeight = false }) => {
  const classes = useStyles({ centered });
  return (
    <Fragment>
      <Header hideEmployers={hideEmployers} />
      <Grid className={isAutoHeight ? classes.autoHeight : classes.root} container>
        {children}
      </Grid>
    </Fragment>
  );
};
