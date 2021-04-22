import React from 'react';

import { Page } from '../../components/generic';
import MaintenanceImg from '../../assets/images/tool-icon.png';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  logo: {
    height: '130px',
    marginBottom: theme.spacing(1.5),
    flexShrink: 0, // Logo should hold its own
  },
}));

export default ({ hideEmployers }) => {

  const classes = useStyles();

  return (
    <Page hideEmployers={hideEmployers}>
      <div className={classes.root}>
        <img
          className={classes.logo}
          src={MaintenanceImg}
          alt="Maintenance"
        />
        <Typography variant='h3'>We are under maintenance!</Typography><br />
        <Typography>We apologize for the inconvenience. We will be live again before 5pm PDT.</Typography>
      </div>
    </Page>
  );
};
