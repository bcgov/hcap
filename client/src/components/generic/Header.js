import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import BcLogo from '../../assets/images/bc-logo.svg';

import { Routes } from '../../constants';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > header': {
      height: '80px',
      boxShadow: 'none',
    },
  },
  appBar: {
    backgroundColor: theme.palette.primary.light,
  },
  toolbar: {
    height: '100%',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.palette.headerText.primary,
    textAlign: 'center',
    marginLeft: theme.spacing(1.0),
    marginTop: theme.spacing(1.4),
  },
  logo: {
    height: '48px',
    cursor: 'pointer',
  },
}));

export const Header = () => {
  const history = useHistory();
  const classes = useStyles();

  const handleLogoClick = () => history.push(Routes.Form);

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Toolbar className={classes.toolbar}>
          <div className={classes.logoWrapper}>
            <img
              className={classes.logo}
              src={BcLogo}
              alt="Logo"
              onClick={handleLogoClick}
            />
            <Typography className={classes.title} variant="subtitle1" gutterBottom>
              Health Career Access Program
            </Typography>
          </div>
        </Toolbar>
      </AppBar>
    </div>
  );
};
