import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

import { Header } from './Header';

const useStyles = makeStyles(() => ({
  root: (props) => ({
    height: props.isAutoHeight ? 'auto' : 'calc(100vh - 82px)',
    justifyContent: props.centered ? 'center' : 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'column',
  }),
}));

// hideEmployers set to true for participant-facing pages
export const Page = ({ children, hideEmployers = false, centered, isAutoHeight = false }) => {
  const classes = useStyles({ centered, isAutoHeight });
  return (
    <Fragment>
      <Header hideEmployers={hideEmployers} />
      <Grid className={classes.root} container>
        {children}
      </Grid>
    </Fragment>
  );
};
