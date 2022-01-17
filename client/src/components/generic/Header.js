import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useHistory, useLocation } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import store from 'store';
import BcLogo from '../../assets/images/bc-logo.svg';
import BcLogoMini from '../../assets/images/bc-logo-mini.svg';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Hidden from '@mui/material/Hidden';
import { Routes } from '../../constants';
import { Button } from './Button';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

const PREFIX = 'Header';

const classes = {
  root: `${PREFIX}-root`,
  appBar: `${PREFIX}-appBar`,
  toolbar: `${PREFIX}-toolbar`,
  logoWrapper: `${PREFIX}-logoWrapper`,
  logoTextWrapper: `${PREFIX}-logoTextWrapper`,
  title: `${PREFIX}-title`,
  titleSmall: `${PREFIX}-titleSmall`,
  logo: `${PREFIX}-logo`,
  verticalDivider: `${PREFIX}-verticalDivider`,
  button: `${PREFIX}-button`,
  buttonWrapper: `${PREFIX}-buttonWrapper`,
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    '& > header': {
      boxShadow: 'none',
    },
  },

  [`& .${classes.appBar}`]: {
    height: '70px',
    backgroundColor: theme.palette.primary.light,
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
  },

  [`& .${classes.toolbar}`]: {
    height: '100%',
    justifyContent: 'space-between',
  },

  [`& .${classes.logoWrapper}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  [`& .${classes.logoTextWrapper}`]: {
    overflow: 'hidden',
  },

  [`& .${classes.title}`]: {
    color: theme.palette.headerText.primary,
    fontWeight: 'bold',
    marginTop: -3,
    fontSize: 'min(2.2em, 3.8vw)',
  },

  [`& .${classes.titleSmall}`]: {
    color: theme.palette.headerText.primary,
    marginBottom: -3,
  },

  [`& .${classes.logo}`]: {
    height: '40px',
    marginBottom: theme.spacing(1.1),
    flexShrink: 0, // Logo should hold its own
  },

  [`& .${classes.verticalDivider}`]: {
    marginLeft: theme.spacing(1.5),
    marginRight: theme.spacing(1.5),
    height: '48px',
    backgroundColor: '#E2A014',
    color: '#E2A014',
    borderStyle: 'solid',
  },

  [`& .${classes.button}`]: {
    padding: theme.spacing(1, 3),
    margin: theme.spacing(0, 1),
  },

  [`& .${classes.buttonWrapper}`]: {
    display: 'flex',
    flexDirection: 'row',
  },
}));

export const Header = ({ hideEmployers = false }) => {
  const history = useHistory();
  const location = useLocation();

  const [keycloak] = useKeycloak();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLoginClick = () => history.push(Routes.Login);
  const isParticipantPortal = window.location.host.match(Routes.ParticipantHostname);

  const handleLogoutClick = async () => {
    store.remove('TOKEN');
    await keycloak.logout({ redirectUri: window.location.origin });
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    setAnchorEl(null);
  };

  const title = () => {
    if (isParticipantPortal) {
      return 'Participant Expression of Interest';
    }
    if (
      location.pathname === Routes.EmployerForm ||
      location.pathname === Routes.EmployerConfirmation
    )
      return 'Employer Expression of Interest';
    return 'Employer Portal';
  };

  return (
    <Root className={classes.root}>
      <AppBar className={classes.appBar} position='static'>
        <Toolbar className={classes.toolbar}>
          <div className={classes.logoWrapper}>
            <Link href='/'>
              <Hidden mdDown>
                <img
                  className={classes.logo}
                  src={BcLogo}
                  alt='Government of British Columbia Home'
                />
              </Hidden>
              <Hidden mdUp>
                <img
                  className={classes.logo}
                  src={BcLogoMini}
                  alt='Government of British Columbia Home'
                />
              </Hidden>
            </Link>
            <hr className={classes.verticalDivider} />
            <div className={classes.logoTextWrapper}>
              <Typography noWrap className={classes.titleSmall} variant='body2'>
                The Health Career Access Program
              </Typography>
              <Typography noWrap className={classes.title} variant='h1'>
                {title()}
              </Typography>
            </div>
          </div>
          {!hideEmployers && (
            <>
              <Hidden smDown>
                <div className={classes.buttonWrapper}>
                  {keycloak.authenticated && location.pathname !== Routes.Admin && (
                    <Button
                      className={classes.button}
                      text='Home'
                      fullWidth={false}
                      variant='outlined'
                      color='inherit'
                      onClick={() => {
                        if (isParticipantPortal) {
                          return history.push(Routes.ParticipantLanding);
                        } else {
                          return history.push(Routes.Admin);
                        }
                      }}
                    />
                  )}
                  {keycloak.authenticated && !keycloak.loginRequired ? (
                    <Button
                      className={classes.button}
                      text='Logout'
                      fullWidth={false}
                      variant='outlined'
                      color='inherit'
                      onClick={handleLogoutClick}
                    />
                  ) : (
                    <Button
                      className={classes.button}
                      text='Login'
                      fullWidth={false}
                      variant='outlined'
                      color='inherit'
                      onClick={handleLoginClick}
                    />
                  )}
                </div>
              </Hidden>
              <Hidden smUp>
                <KeyboardArrowDownIcon onClick={handleMenuClick} />
                <Menu
                  id='login-menu'
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  {keycloak.authenticated && location.pathname !== Routes.Admin && (
                    <MenuItem
                      key='Home'
                      onClick={() => {
                        if (isParticipantPortal) {
                          return history.push(Routes.ParticipantLanding);
                        } else {
                          return history.push(Routes.Admin);
                        }
                      }}
                    >
                      Home
                    </MenuItem>
                  )}
                  {keycloak.authenticated && !keycloak.loginRequired ? (
                    <MenuItem key='Login' onClick={handleLogoutClick}>
                      Logout
                    </MenuItem>
                  ) : (
                    <MenuItem key='Login' onClick={handleLoginClick}>
                      Login
                    </MenuItem>
                  )}
                </Menu>
              </Hidden>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Root>
  );
};
