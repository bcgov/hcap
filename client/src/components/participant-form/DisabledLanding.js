import React from 'react';

import { Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import heroBackground from '../../assets/images/disabled-peoi-hero.png';
import { EmailSubmissionForm } from './EmailSubmissionForm';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  infoContainer: {
    top: '100%',
    transform: 'translateY(-50%)',
    position: 'absolute',
    zIndex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      position: 'static',
      top: 'auto',
      transform: 'none',
      width: '100%',
    },
  },
  infoBox: {
    background: 'white',
    padding: '3rem 7.5rem',
    borderRadius: '.25rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 'clamp(775px, 65%, 1000px)',
    [theme.breakpoints.down('sm')]: {
      position: 'static',
      top: 'auto',
      transform: 'none',
      width: 'auto',
      margin: '1rem',
      padding: '1rem',
    },
  },
  infoBoxHeader: {
    marginBottom: '1rem',

    [theme.breakpoints.down('sm')]: {
      fontSize: '2rem',
      lineHeight: '2.25rem',
    },
  },
  infoBoxParagraph: {
    fontSize: '16px',
    marginBottom: '1rem',
    lineHeight: '24px',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'left',
    },
  },
  hero: {
    width: '100%',
    minHeight: '300px',
    zIndex: '0',
    objectFit: 'cover',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  heading: {
    position: 'absolute',
    zIndex: '1',
    color: 'white',
    bottom: '100%',
    marginBottom: '2rem',
    [theme.breakpoints.down('sm')]: {
      background: theme.palette.primary.lighter,
      position: 'static',
      textAlign: 'center',
      top: 'auto',
      transform: 'none',
      width: '100%',
      fontSize: '2rem',
      margin: 0,
      fontWeight: 'bold',
      padding: '2rem',
    },
  },
  submissionContainer: {
    position: 'absolute',
    zIndex: '1',
    top: '100%',
    marginTop: '1rem',
  },
  submissionHeader: {
    color: '#1a5a96',
    margin: '0 1rem 1rem 1rem',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'center',
      fontSize: '1.5rem',
      lineHeight: '1.75rem',
    },
  },
}));

export const DisabledLanding = () => {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <img src={heroBackground} alt='' className={classes.hero} />

      <Box className={classes.infoContainer}>
        <Typography variant='h1' className={classes.heading}>
          Work In The Health Care Sector
        </Typography>
        <Box className={classes.infoBox}>
          <Typography variant='h2' className={classes.infoBoxHeader}>
            Submissions are temporarily closed
          </Typography>

          <Typography variant='body1' className={classes.infoBoxParagraph}>
            The participant expression of interest for the HCAP program is now closed and may reopen
            as more opportunities become available. Thank you for your interest in the program. To
            learn more, visit the{' '}
            <a href='https://gov.bc.ca/careersinhealth' target='_blank' rel='noreferrer'>
              Health Career Access Program
            </a>
            .
          </Typography>
          <Typography variant='body1' className={classes.infoBoxParagraph}>
            Eligible employers will continue to reach out to those who are currently in the system.
            If you have any questions, please email{' '}
            <a href='mailto:HCAPInfoQuery@gov.bc.ca' target='_blank' rel='noreferrer'>
              HCAPInfoQuery@gov.bc.ca
            </a>
            .
          </Typography>
        </Box>

        <Box className={classes.submissionContainer}>
          <Typography variant='subtitle1' className={classes.submissionHeader}>
            Get notified when the submissions are open
          </Typography>
          <EmailSubmissionForm />
        </Box>
      </Box>
    </Box>
  );
};
