import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Hidden from '@material-ui/core/Hidden';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import DesktopLogo from '../../assets/images/desktop-logo.svg';
import MobileLogo from '../../assets/images/mobile-logo.svg';
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
    flexGrow: 1,
  },
  logo: {
    height: '48px',
    cursor: 'pointer',
  },
  button: {
    height: '42px',
    padding: theme.spacing(1, 3),
    margin: theme.spacing(0, 1),
  },
}));

export const Header = () => {
  const history = useHistory();
  const location = useLocation();
  const params = useParams();
  const classes = useStyles();

  const isSubmissionsScreen = location.pathname.includes(Routes.Submissions);
  const isSubmissionDetailsScreen = (location.pathname === Routes.SubmissionDetails.dynamicRoute(params.confirmationNumber));

  const handleLogoClick = () => history.push(Routes.Form);
  const handleSubmissionsClick = () => history.push(Routes.Submissions);
  const handleLogoutClick = () => {
    localStorage.removeItem('jwt');
    history.push(Routes.Login);
  };

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Toolbar className={classes.toolbar}>
          <div className={classes.logoWrapper}>
            <Hidden smDown>
              <img
                className={classes.logo}
                src={DesktopLogo}
                alt="Logo"
                onClick={handleLogoClick}
              />
            </Hidden>
            <Hidden mdUp>
              <img
                className={classes.logo}
                src={MobileLogo}
                alt="Logo"
                onClick={handleLogoClick}
              />
            </Hidden>
          </div>
          {isSubmissionDetailsScreen && (
            <Button
              id="submissions"
              className={classes.button}
              variant="outlined"
              color="inherit"
              onClick={handleSubmissionsClick}
            >
              Submissions
            </Button>
          )}
          {(isSubmissionsScreen || isSubmissionDetailsScreen) && (
            <Button
              id="logout"
              className={classes.button}
              variant="outlined"
              color="inherit"
              onClick={handleLogoutClick}
            >
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
};
