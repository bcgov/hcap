import React from 'react';
import { useHistory } from 'react-router-dom';

import Alert from '@material-ui/lab/Alert';
import { Button as MuiButton, Box, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import { Page, Button } from '../../components/generic';
import LoginFooter from './LoginFooter';
import { Routes, HCAP_LINK, PEOI_LINK } from '../../constants';
import backgroundImage from '../../assets/images/emp_login_bg.png';

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
        <Box px={10} pt={12} pb={7} maxWidth='60%'>
          <Typography variant='subtitle1' className={classes.blueText}>
            Health Care Access Program
          </Typography>

          <Typography className={classes.titleText}>Welcome to the Employer Portal</Typography>

          <Box my={2}>
            <Typography variant='body1' className={classes.mainText}>
              The Health Career Access Program (HCAP) is a paid work and training initiative for
              individuals seeking an entry point to employment in health. New hires will start as a
              Health Care Support Worker providing non-direct care at a long-term care or assisted
              living site and receive paid training to become a Health Care Assistant upon
              successful completion of the program.
            </Typography>
          </Box>
          <Box my={2}>
            <Typography variant='body1' className={classes.mainText}>
              HCAP has many benefits for employers who will have the opportunity to access new
              provincially funded staffing and training resources and play a key role in building
              capacity in the BC health sector and economy.
            </Typography>
          </Box>
          <Box my={2}>
            <Typography variant='body1' className={classes.mainText}>
              Participating employers will be provided with funding to cover education and salary
              costs for hire Health Care Support Workers who will provide critical non-clinical
              support while enrolled in a new modular Health Care Assistant training program. The
              HCAP will roll out as a partnership between candidates and employers to work through
              onboarding, orientation, employer-based training, and the HCA employer- sponsored
              training program.
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
              <Link href='mailto:HCAPInfoQuery@gov.bc.ca'>HCAPInfoQuery@gov.bc.ca</Link>
            </b>
          </Alert>
        </Box>

        <Box px={10} pt={12} pb={5} className={classes.employerLoginBox}>
          <Box mt={'30%'}>
            <Typography variant='h2'>Login</Typography>
            <Box my={2}>
              <Typography variant='body1' className={classes.loginText}>
                Log in with your IDIR or BCeID to the Health Care Access Program Employer Portal.
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

          <Box mt='35%'>
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
      <LoginFooter />
    </Page>
  );
};
