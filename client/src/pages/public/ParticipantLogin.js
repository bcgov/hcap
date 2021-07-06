import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { Page, Button } from '../../components/generic';
import { useHistory } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { Routes } from '../../constants';

const useStyles = makeStyles((theme) => ({
  button: {
    color: 'white',
    marginTop: '10px',
  },
  blueText: {
    color: theme.palette.primary.light,
  },
  blueBox: {
    backgroundColor: '#EDF6FF',
    width: 554,
    height: 205,
  },
  rightContainer: {
    backgroundColor: '#FFFFFF',
    height: 'calc(100vh - 68px)',
  },
  leftContainer: {
    height: 'calc(100vh - 68px)',
  },
}));

export default () => {
  const classes = useStyles();
  const [keycloak] = useKeycloak();
  const history = useHistory();
  const redirectToLogin = () => {
    keycloak.login({ idpHint: 'BCSC', redirectUri: `${window.location.origin}${Routes.Success}` });
  };
  const redirectToForm = () => {
    history.push(Routes.ParticipantForm);
  };

  return (
    <Page>
      <Grid container>
        <Grid item sm={6} xs={12}>
          <Box pl={20} pr={4} pt={10}>
            <Box mb={3}>
              <Typography variant='h2'>
                <b>Sign In</b>
              </Typography>
            </Box>
            <Typography>
              You can use a mobile BC Services Card to sign in to the <br /> Health Care Access
              Program
            </Typography>
            <Box
              borderRadius={5}
              onClick={redirectToLogin}
              border={1}
              borderColor='primary.main'
              mt={2}
              mb={2}
              p={3}
            >
              <Typography variant={'subtitle1'} className={classes.blueText}>
                <b>Sign in with BC Services Card</b>
              </Typography>
              <Typography variant={'body1'}>
                You can use your BC Services Card to log in to government services. It's a sercure
                way to prove who you are online.
              </Typography>
            </Box>
            <Typography variant={'body2'}>
              For more information on the BC Services Card, including how to set up your mobile BC
              Services Card visit:&nbsp;
              <a href='https://www2.gov.bc.ca/gov/content/governments/government-id/bc-services-card/log-in-with-card/mobile-card'>
                https://www2.gov.bc.ca/gov/content/governments/government-id/bc-services-card/log-in-with-card/mobile-card
              </a>
            </Typography>
          </Box>
        </Grid>
        <Grid item sm={6} xs={12}>
          <Box pt={10} pl={4} pr={20} className={classes.rightContainer}>
            <Typography variant='subtitle1' className={classes.blueText}>
              Work in the health care sector
            </Typography>
            <Box mb={3}>
              <Typography variant='h2'>Welcome to the Health Career Access Program</Typography>
            </Box>
            <Typography mb={2}>
              COVID-19 has increased the need for health care assistants in long-term care and
              assisted living settings across the province. The Health Career Access Program
              provides a path for applicants with no health care experience to het hired receive
              paid employer sponsored health care assistant training as part of their employment.
            </Typography>
            <Box p={4} mt={2} className={classes.blueBox}>
              <Typography variant={'subtitle2'} className={classes.blueText}>
                Don't have an account yet
              </Typography>
              <Typography>
                To start as a health care support worker, you need to submit your expression of
                interest first.
              </Typography>
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
        </Grid>
      </Grid>
    </Page>
  );
};
