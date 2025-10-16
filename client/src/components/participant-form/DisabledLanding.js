import React from 'react';
import { Typography, Box, styled } from '@mui/material';

import heroBackground from '../../assets/images/disabled-peoi-hero.png';
import { EmailSubmissionForm, EmailSubmissionHeader } from './EmailSubmissionForm';
import { HEALTH_CAREERS_LINK } from '../../constants';

const Container = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr clamp(775px, 65%, 1000px) 1fr',
  gridTemplateRows: '150px 150px 150px 1fr',
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    display: 'block',
  },
}));

const HeroImage = styled('img')(({ theme }) => ({
  zIndex: 0,
  gridArea: '1 / 1 / 3 / 4',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const Heading = styled(Typography)(({ theme }) => ({
  zIndex: 1,
  gridArea: '1 / 2',
  color: 'white',
  justifySelf: 'center',
  alignSelf: 'end',
  padding: '2rem',
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    background: theme.palette.primary.lighter,
  },
}));

const InfoBox = styled(Box)(({ theme }) => ({
  zIndex: 1,
  gridArea: '2 / 2 / 4 / 3',
  background: 'white',
  padding: '3rem 7.5rem',
  borderRadius: '.25rem',
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    width: 'auto',
    margin: '1rem',
    marginBottom: '2rem',
    padding: '1rem',
  },
}));

const InfoBoxHeader = styled(Typography)(({ theme }) => ({
  marginBottom: '1rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
    lineHeight: '2.25rem',
  },
}));

const InfoBoxParagraph = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  marginBottom: '1rem',
  lineHeight: '24px',
  [theme.breakpoints.down('sm')]: {
    textAlign: 'left',
  },
}));

const SubmissionContainer = styled(Box)(({ theme }) => ({
  gridArea: '4 / 2',
  width: '50%',
  justifySelf: 'center',
  margin: '1rem',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    margin: 0,
  },
}));

export const DisabledLanding = () => {
  return (
    <Container>
      <HeroImage src={heroBackground} alt='' />

      <Heading variant='h1'>Work In The Health Care Sector</Heading>

      <InfoBox>
        <InfoBoxHeader variant='h2'>Submissions are temporarily closed</InfoBoxHeader>

        <InfoBoxParagraph variant='body1'>
          The participant expression of interest for the HCAP program is now closed and may reopen
          as more opportunities become available. Thank you for your interest in the program. To
          learn more, visit the{' '}
          <a href={HEALTH_CAREERS_LINK} target='_blank' rel='noreferrer'>
            Health Career Access Program
          </a>
          .
        </InfoBoxParagraph>

        <InfoBoxParagraph variant='body1'>
          Eligible employers will continue to reach out to those who are currently in the system.
        </InfoBoxParagraph>
      </InfoBox>

      <SubmissionContainer>
        <EmailSubmissionHeader />
        <EmailSubmissionForm />
      </SubmissionContainer>
    </Container>
  );
};
