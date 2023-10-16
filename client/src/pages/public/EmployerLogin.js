import React from 'react';
import { useHistory } from 'react-router-dom';

import Alert from '@material-ui/lab/Alert';
import { Button as MuiButton, Box, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import { Page, Button } from '../../components/generic';
import { Routes, HCAP_LINK, PEOI_LINK, HCAP_INFO_EMAIL } from '../../constants';
import backgroundImage from '../../assets/images/emp_login_bg.jpg';

const useStyles = makeStyles((theme) => ({
  blueText: {
    color: theme.palette.primary.light,
  },
  titleText: {
    fontSize: '40px',
    lineHeight: '56px',
    fontWeight: 700,
  },
  mainText: {
    fontSize: '17px',
    lineHeight: '24px',
    fontWeight: 400,
  },
  loginText: {
    fontSize: '20px',
    lineHeight: '38px',
    fontWeight: 400,
  },
  buttonLink: {
    color: theme.palette.primary.lighter,
    textDecoration: 'underline',
    fontSize: '17px',
    fontWeight: 700,
  },
  employerLoginBox: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: '55% 50%',
  },
  employerAlert: {
    fontSize: '17px',
    lineHeight: '24px',
    fontWeight: 400,
    backgroundColor: theme.palette.default.white,
    boxShadow: '0px 4px 7px rgba(0, 0, 0, 0.15)',
    borderRadius: '4px',
  },
}));

export default () => {
  const classes = useStyles();
  const history = useHistory();

  const redirectToLogin = () => history.push(Routes.Login);

  return (
    <Page>
      <Box display='flex'>
        <Box p={12} maxWidth='60%'>
          <Typography variant='subtitle1' className={classes.blueText}>
            Health Career Access Program
          </Typography>

          <Typography className={classes.titleText}>Welcome to the Employer Portal</Typography>

          <Box my={2}>
            <Typography variant='body1' className={classes.mainText}>
              The Health Career Access Program (HCAP) provides a path for applicants with little to
              no sector experience to get hired and receive paid training as part of their
              employment. There are two pathways, one to train as a health care assistant and
              another to train as a mental health and addictions worker. Both offer rewarding and
              varied work with the opportunity to make a difference in the lives of others every
              day.
            </Typography>
          </Box>
          <Box my={2}>
            <Typography variant='body1' className={classes.mainText}>
              HCAP has many benefits for employers who will have the opportunity to access new
              provincially funded staffing and training resources and play a key role in building
              capacity in the BC health sector and care economy. Participating employers will be
              provided with funding to cover participant education and salary costs during the
              program.
            </Typography>
          </Box>
          <Box my={2}>
            <Typography variant='body1' className={classes.mainText}>
              HCAP will roll out as a partnership between candidates and employers to work through
              onboarding, orientation, employer-based training, and the employer- sponsored training
              program.
            </Typography>
          </Box>

          <Box my={2}>
            <MuiButton
              className={classes.buttonLink}
              href={HCAP_LINK}
              target='_blank'
              endIcon={<ArrowForwardIcon />}
            >
              Learn more about the program
            </MuiButton>
          </Box>

          <Alert severity='info' className={classes.mainText}>
            If you have any questions, please contact the Health Career Access Program at:&nbsp;
            <b>
              <Link href={`mailto:${HCAP_INFO_EMAIL}`}>{HCAP_INFO_EMAIL}</Link>
            </b>
          </Alert>
        </Box>

        <Box p={12} className={classes.employerLoginBox}>
          <Box mt={'30%'}>
            <Typography variant='h2'>Login</Typography>
            <Box my={2}>
              <Typography variant='body1' className={classes.loginText}>
                Log in with your IDIR or BCeID to the Health Career Access Program Employer Portal.
              </Typography>
            </Box>
            <Box>
              <Button
                fullWidth={false}
                variant='contained'
                color='primary'
                text='Login'
                onClick={redirectToLogin}
              />
            </Box>
          </Box>

          <Box mt='40%'>
            <Alert severity='info' className={classes.employerAlert}>
              If you're a participant,&nbsp;
              <b>
                <Link href={PEOI_LINK} target='_blank'>
                  click here
                </Link>
              </b>
              &nbsp;to login to the participant portal
            </Alert>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};
