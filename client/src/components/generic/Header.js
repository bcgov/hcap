import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory, useLocation } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import store from 'store';
import BcLogo from '../../assets/images/bc-logo.svg';
import BcLogoMini from '../../assets/images/bc-logo-mini.svg';
import Hidden from '@material-ui/core/Hidden';
import { Routes } from '../../constants';
import { Button } from './Button';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > header': {
      boxShadow: 'none',
    },
  },
  appBar: {
    height: '70px',
    backgroundColor: theme.palette.primary.light,
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
  },
  toolbar: {
    height: '100%',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  logoTextWrapper: {
    overflow: 'hidden',
  },
  title: {
    color: theme.palette.headerText.primary,
    fontWeight: 'bold',
    marginTop: -3,
    fontSize: '2.2em',
  },
  titleSmall: {
    color: theme.palette.headerText.primary,
    marginBottom: -3,
  },
  logo: {
    height: '40px',
    marginBottom: theme.spacing(1.1),
    flexShrink: 0, // Logo should hold its own
  },
  verticalDivider: {
    marginLeft: theme.spacing(1.5),
    marginRight: theme.spacing(1.5),
    height: '48px',
    backgroundColor: '#E2A014',
    color: '#E2A014',
    borderStyle: 'solid',
  },
  button: {
    padding: theme.spacing(1, 3),
    margin: theme.spacing(0, 1),
  },
  buttonWrapper: {
    display: 'flex',
    flexDirection: 'row',
  },
}));

export const Header = ({hideEmployers=false}) => {
  const history = useHistory();
  const location = useLocation();
  const classes = useStyles();
  const [keycloak] = useKeycloak();

  const handleLogoClick = () => history.push(Routes.EmployerForm);

  const handleLoginClick = () => history.push(Routes.Login);

  const handleLogoutClick = async () => {
    store.remove('TOKEN');
    await keycloak.logout({ redirectUri: window.location.origin });
  };

  const title = () => {
    if (hideEmployers) return 'Participant Expression of Interest';
    if (location.pathname === Routes.EmployerForm || location.pathname === Routes.EmployerConfirmation) return 'Employer Expression of Interest';
    return 'Employer Portal';
  };

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Toolbar className={classes.toolbar}>
          <div className={classes.logoWrapper}>
            <a href="https://www2.gov.bc.ca/gov/content/home">
              <Hidden smDown>
                <img
                  className={classes.logo}
                  src={BcLogo}
                  alt="Government of british columbia home"
                  onClick={handleLogoClick}
                />
              </Hidden>
              <Hidden mdUp>
                <img
                  className={classes.logo}
                  src={BcLogoMini}
                  alt="Government of british columbia home"
                  onClick={handleLogoClick}
                />
              </Hidden>
            </a>
            <hr className={classes.verticalDivider} />
            <div className={classes.logoTextWrapper}>
              <Typography noWrap className={classes.titleSmall} variant="body2">
                The Health Career Access Program
              </Typography>
              <Typography noWrap className={classes.title} variant="h1">
                {title()}
              </Typography>
            </div>
          </div>
          {!hideEmployers && <div className={classes.buttonWrapper}>
            {(keycloak.authenticated && location.pathname !== Routes.Admin) && (
              <Button
                className={classes.button}
                text="Home"
                fullWidth={false}
                variant="outlined"
                color="inherit"
                onClick={() => history.push(Routes.Admin)}
              />
            )}
            {(keycloak.authenticated && !keycloak.loginRequired) ?
              <Button
                className={classes.button}
                text="Logout"
                fullWidth={false}
                variant="outlined"
                color="inherit"
                onClick={handleLogoutClick}
              />
              :
              <Button
                className={classes.button}
                text="Login"
                fullWidth={false}
                variant="outlined"
                color="inherit"
                onClick={handleLoginClick}
              />
            }
          </div>}
        </Toolbar>
      </AppBar>
    </div>
  );
};
