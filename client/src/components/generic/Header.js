import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeycloak } from '../../providers/KeycloakProvider';
import storage from '../../utils/storage';
import BcLogo from '../../assets/images/bc-logo.svg';
import BcLogoMini from '../../assets/images/bc-logo-mini.svg';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useMediaQuery, useTheme } from '@mui/material';
import { Routes } from '../../constants';
import { Button } from './Button';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  height: '70px',
  backgroundColor: theme.palette.primary.light,
  borderBottom: `2px solid ${theme.palette.secondary.main}`,
  boxShadow: 'none',
}));

const StyledToolbar = styled(Toolbar)({
  height: '100%',
  justifyContent: 'space-between',
});

const LogoWrapper = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  overflow: 'hidden',
});

const LogoTextWrapper = styled('div')({
  overflow: 'hidden',
});

const StyledTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.headerText.primary,
  fontWeight: 'bold',
  marginTop: -3,
  fontSize: 'min(2.2em, 3.8vw)',
}));

const StyledTitleSmall = styled(Typography)(({ theme }) => ({
  color: theme.palette.headerText.primary,
  marginBottom: -3,
}));

const StyledLogo = styled('img')(({ theme }) => ({
  height: '40px',
  marginBottom: theme.spacing(1.1),
  flexShrink: 0,
}));

const VerticalDivider = styled('hr')(({ theme }) => ({
  marginLeft: theme.spacing(1.5),
  marginRight: theme.spacing(1.5),
  height: '48px',
  backgroundColor: theme.palette.secondary.light,
  color: theme.palette.secondary.light,
  borderStyle: 'solid',
}));

const ButtonWrapper = styled('div')({
  display: 'flex',
  flexDirection: 'row',
});

export const Header = ({ hideEmployers = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { keycloak } = useKeycloak();
  const [anchorEl, setAnchorEl] = useState(null);
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isXsUp = useMediaQuery(theme.breakpoints.up('xs'));

  const handleLoginClick = () => navigate(Routes.Login);
  const isParticipantPortal = window.location.host.match(Routes.ParticipantHostname);

  const handleLogoutClick = async () => {
    storage.remove('TOKEN');

    let redirectUri = window.location.origin;
    if (
      keycloak?.authServerUrl?.includes('common-logon-dev') ||
      keycloak?.authServerUrl?.includes('common-logon-test')
    ) {
      redirectUri = `https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=${redirectUri}`;
    } else if (keycloak?.authServerUrl?.includes('common-logon')) {
      redirectUri = `https://logon7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=${redirectUri}`;
    }

    await keycloak?.logout({ redirectUri });
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
    <div>
      <StyledAppBar position='static'>
        <StyledToolbar>
          <LogoWrapper>
            <Link href='/'>
              {isMdUp ? (
                <StyledLogo src={BcLogo} alt='Government of British Columbia Home' />
              ) : (
                <StyledLogo src={BcLogoMini} alt='Government of British Columbia Home' />
              )}
            </Link>
            <VerticalDivider />
            <LogoTextWrapper>
              <StyledTitleSmall noWrap variant='body2'>
                The Health Career Access Program
              </StyledTitleSmall>
              <StyledTitle noWrap variant='h1'>
                {title()}
              </StyledTitle>
            </LogoTextWrapper>
          </LogoWrapper>
          {!hideEmployers && (
            <>
              {isXsUp && (
                <ButtonWrapper>
                  {keycloak.authenticated && location.pathname !== Routes.Admin && (
                    <Button
                      sx={{
                        padding: theme.spacing(1, 3),
                        margin: theme.spacing(0, 1),
                      }}
                      text='Home'
                      fullWidth={false}
                      variant='outlined'
                      color='inherit'
                      onClick={() => {
                        if (isParticipantPortal) {
                          return navigate(Routes.ParticipantLanding);
                        } else {
                          return navigate(Routes.Admin);
                        }
                      }}
                    />
                  )}
                  {keycloak.authenticated && !keycloak.loginRequired ? (
                    <Button
                      sx={{
                        padding: theme.spacing(1, 3),
                        margin: theme.spacing(0, 1),
                      }}
                      text='Logout'
                      fullWidth={false}
                      variant='outlined'
                      color='inherit'
                      onClick={handleLogoutClick}
                    />
                  ) : (
                    <Button
                      sx={{
                        padding: theme.spacing(1, 3),
                        margin: theme.spacing(0, 1),
                      }}
                      text='Login'
                      fullWidth={false}
                      variant='outlined'
                      color='inherit'
                      onClick={handleLoginClick}
                    />
                  )}
                </ButtonWrapper>
              )}
              {!isSmUp && (
                <>
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
                            return navigate(Routes.ParticipantLanding);
                          } else {
                            return navigate(Routes.Admin);
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
                </>
              )}
            </>
          )}
        </StyledToolbar>
      </StyledAppBar>
    </div>
  );
};
