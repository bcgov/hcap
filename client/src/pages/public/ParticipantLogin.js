import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Page, Button } from '../../components/generic';
import { useKeycloak } from '@react-keycloak/web';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { Routes, BC_SERVICES_CARD_LINK } from '../../constants';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  blueText: {
    color: theme.palette.primary.light,
  },
  blueBox: {
    backgroundColor: '#EDF6FF',
    maxWidth: 554,
  },
  pageContainer: {
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
    },
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row',
    },
  },
  rightContainer: {
    padding: '10%',
    [theme.breakpoints.up('md')]: {
      width: '50%',
    },
    backgroundColor: '#FFFFFF',
  },
  leftContainer: {
    padding: '10%',
    [theme.breakpoints.up('md')]: {
      width: '50%',
    },
  },
}));

export default () => {
  const classes = useStyles();
  const [keycloak] = useKeycloak();

  const history = useHistory();

  const redirectToLogin = () => {
    keycloak.login({
      idpHint: 'bcsc_hcap',
      redirectUri: `${window.location.origin}${Routes.ParticipantLanding}`,
    });
  };
  const redirectToForm = () => {
    history.push(Routes.ParticipantForm);
  };

  return (
    <Page hideEmployers={true}>
      <Box container display='flex' minHeight='100%' className={classes.pageContainer}>
        <Box className={classes.leftContainer}>
          <Box mb={3}>
            <Typography variant='h2'>
              <b>Login</b>
            </Typography>
          </Box>
          <Box mb={2}>
            <Typography>
              You can use a mobile BC Services Card to log in to the <br /> Health Care Access
              Program
            </Typography>
          </Box>
          <Box mb={2}>
            <Button
              className={classes.button}
              onClick={redirectToLogin}
              fullWidth={false}
              variant='contained'
              color='primary'
              style={{ 'text-transform': 'none' }}
              text={'Login with BC Services Card'}
            />
          </Box>
          <Typography variant={'body2'}>
            A <a href={BC_SERVICES_CARD_LINK}>BC Services Card</a> provides secure access to
            government services.
          </Typography>
        </Box>
        <Box className={classes.rightContainer}>
          <Typography variant='subtitle1' color='' className={classes.blueText}>
            Work in the health care sector
          </Typography>
          <Box mb={3}>
            <Typography variant='h2'>Welcome to the Health Career Access Program</Typography>
          </Box>
          <Typography mb={2}>
            COVID-19 has increased the need for health care assistances in long-term care and
            assisted living settings and home support locations across the province. The Health
            Career Access Program provides a path for applicants with no health care experience to
            get hired and receive paid employer sponsored health care assistant training as part of
            their employment.
          </Typography>
          <Box p={4} mt={2} className={classes.blueBox}>
            <Typography variant={'subtitle2'} className={classes.blueText}>
              Don't have an account yet?
            </Typography>
            <Box mb={2}>
              <Typography>
                To start as a health care support worker, you need to submit your expression of
                interest first.
              </Typography>
            </Box>
            <Button
              className={classes.button}
              variant='contained'
              color='primary'
              fullWidth={false}
              text={'Submit Your Expression of Interest'}
              onClick={redirectToForm}
              m={2}
            />
          </Box>
        </Box>
      </Box>
    </Page>
  );
};
