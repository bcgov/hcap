import React from 'react';

import { styled } from '@mui/material/styles';

import { Typography, Box } from '@mui/material';

import heroBackground from '../../assets/images/disabled-peoi-hero.png';
import { EmailSubmissionForm, EmailSubmissionHeader } from './EmailSubmissionForm';

const PREFIX = 'DisabledLanding';

const classes = {
  container: `${PREFIX}-container`,
  hero: `${PREFIX}-hero`,
  heading: `${PREFIX}-heading`,
  infoBox: `${PREFIX}-infoBox`,
  infoBoxHeader: `${PREFIX}-infoBoxHeader`,
  infoBoxParagraph: `${PREFIX}-infoBoxParagraph`,
  submissionContainer: `${PREFIX}-submissionContainer`,
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.container}`]: {
    display: 'grid',
    gridTemplateColumns: '1fr clamp(775px, 65%, 1000px) 1fr',
    gridTemplateRows: '150px 150px 150px 1fr',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      display: 'block',
    },
  },

  [`& .${classes.hero}`]: {
    zIndex: '0',
    gridArea: '1 / 1 / 3 / 4',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },

  [`& .${classes.heading}`]: {
    zIndex: '1',
    gridArea: '1 / 2',
    color: 'white',
    justifySelf: 'center',
    alignSelf: 'end',
    padding: '2rem',
    [theme.breakpoints.down('md')]: {
      textAlign: 'center',
      fontSize: '2rem',
      fontWeight: 'bold',
      background: theme.palette.primary.lighter,
    },
  },

  [`& .${classes.infoBox}`]: {
    zIndex: 1,
    gridArea: '2 / 2 / 4 / 3',
    background: 'white',
    padding: '3rem 7.5rem',
    borderRadius: '.25rem',
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
      width: 'auto',
      margin: '1rem',
      marginBottom: '2rem',
      padding: '1rem',
    },
  },

  [`& .${classes.infoBoxHeader}`]: {
    marginBottom: '1rem',

    [theme.breakpoints.down('md')]: {
      fontSize: '2rem',
      lineHeight: '2.25rem',
    },
  },

  [`& .${classes.infoBoxParagraph}`]: {
    fontSize: '16px',
    marginBottom: '1rem',
    lineHeight: '24px',
    [theme.breakpoints.down('md')]: {
      textAlign: 'left',
    },
  },

  [`& .${classes.submissionContainer}`]: {
    gridArea: '4 / 2',
    width: '50%',
    justifySelf: 'center',
    margin: '1rem',
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: '0',
    },
  },
}));

export const DisabledLanding = () => {
  return (
    <StyledBox className={classes.container}>
      <img src={heroBackground} alt='' className={classes.hero} />

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
          Eligible employers will continue to reach out to those who are currently in the system. If
          you have any questions, please email{' '}
          <a href='mailto:HCAPInfoQuery@gov.bc.ca' target='_blank' rel='noreferrer'>
            HCAPInfoQuery@gov.bc.ca
          </a>
          .
        </Typography>
      </Box>

      <Box className={classes.submissionContainer}>
        <EmailSubmissionHeader />
        <EmailSubmissionForm />
      </Box>
    </StyledBox>
  );
};
