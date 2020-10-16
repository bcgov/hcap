import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import BcLogo from '../../assets/images/bc-logo.svg';
import BcLogoMini from '../../assets/images/bc-logo-mini.svg';
import Hidden from '@material-ui/core/Hidden';
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.palette.headerText.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: theme.spacing(1.4),
  },
  logo: {
    height: '40px',
    marginBottom: theme.spacing(1.1),
    cursor: 'pointer',
  },
  verticalDivider: {
    marginLeft: theme.spacing(1.5),
    marginRight: theme.spacing(1.5),
    height: '48px',
    backgroundColor: '#E2A014',
    color: '#E2A014',
    borderStyle: 'solid',
  }
}));

export const Header = () => {
  const history = useHistory();
  const classes = useStyles();

  const handleLogoClick = () => history.push(Routes.EmployerForm);

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Toolbar className={classes.toolbar}>
          <div className={classes.logoWrapper}>
            <Hidden smDown>
              <img
                className={classes.logo}
                src={BcLogo}
                alt="Logo"
                onClick={handleLogoClick}
              />
            </Hidden>
            <Hidden mdUp>
              <img
                className={classes.logo}
                src={BcLogoMini}
                alt="Logo Mini"
                onClick={handleLogoClick}
              />
            </Hidden>
            <hr className={classes.verticalDivider} />
            <Typography className={classes.title} variant="h2" gutterBottom>
              Employer Expression of Interest
            </Typography>
          </div>
        </Toolbar>
      </AppBar>
    </div>
  );
};
