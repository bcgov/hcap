import React from 'react';
import { useNavigate } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import { Button as MuiButton, Box, Typography, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { Page, Button } from '../../components/generic';
import { Routes, HCAP_LINK, PEOI_LINK, HCAP_INFO_EMAIL } from '../../constants';
import backgroundImage from '../../assets/images/emp_login_bg.jpg';

const StyledMuiButton = styled(MuiButton)(({ theme }) => ({
  color: theme.palette.primary.lighter,
  textDecoration: 'underline',
  fontSize: '17px',
  fontWeight: 700,
}));

const StyledEmployerLoginBox = styled(Box)(() => ({
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: '55% 50%',
}));

const StyledEmployerAlert = styled(Alert)(({ theme }) => ({
  fontSize: '17px',
  lineHeight: '24px',
  fontWeight: 400,
  backgroundColor: theme.palette.default.white,
  boxShadow: '0px 4px 7px rgba(0, 0, 0, 0.15)',
  borderRadius: '4px',
}));

export default () => {
  const navigate = useNavigate();

  const redirectToLogin = () => {
    console.log('Login button clicked, navigating to:', Routes.Login);
    navigate(Routes.Login);
  };

  return (
    <Page>
      <Box display='flex'>
        <Box p={12} maxWidth='60%'>
          <Typography variant='subtitle1' sx={{ color: 'primary.light' }}>
            Health Career Access Program
          </Typography>

          <Typography sx={{ fontSize: '40px', lineHeight: '56px', fontWeight: 700 }}>
            Welcome to the Employer Portal
          </Typography>

          <Box my={2}>
            <Typography
              variant='body1'
              sx={{ fontSize: '17px', lineHeight: '24px', fontWeight: 400 }}
            >
              The Health Career Access Program (HCAP) provides a path for applicants with little to
              no sector experience to get hired and receive paid training as part of their
              employment. There are two pathways, one to train as a health care assistant and
              another to train as a mental health and addictions worker. Both offer rewarding and
              varied work with the opportunity to make a difference in the lives of others every
              day.
            </Typography>
          </Box>
          <Box my={2}>
            <Typography
              variant='body1'
              sx={{ fontSize: '17px', lineHeight: '24px', fontWeight: 400 }}
            >
              HCAP has many benefits for employers who will have the opportunity to access new
              provincially funded staffing and training resources and play a key role in building
              capacity in the BC health sector and care economy. Participating employers will be
              provided with funding to cover participant education and salary costs during the
              program.
            </Typography>
          </Box>
          <Box my={2}>
            <Typography
              variant='body1'
              sx={{ fontSize: '17px', lineHeight: '24px', fontWeight: 400 }}
            >
              HCAP will roll out as a partnership between candidates and employers to work through
              onboarding, orientation, employer-based training, and the employer- sponsored training
              program.
            </Typography>
          </Box>

          <Box my={2}>
            <StyledMuiButton href={HCAP_LINK} target='_blank' endIcon={<ArrowForwardIcon />}>
              Learn more about the program
            </StyledMuiButton>
          </Box>

          <Alert severity='info' sx={{ fontSize: '17px', lineHeight: '24px', fontWeight: 400 }}>
            If you have any questions, please contact the Health Career Access Program at:&nbsp;
            <b>
              <Link href={`mailto:${HCAP_INFO_EMAIL}`}>{HCAP_INFO_EMAIL}</Link>
            </b>
          </Alert>
        </Box>

        <StyledEmployerLoginBox p={12}>
          <Box mt={'30%'}>
            <Typography variant='h2'>Login</Typography>
            <Box my={2}>
              <Typography
                variant='body1'
                sx={{ fontSize: '20px', lineHeight: '38px', fontWeight: 400 }}
              >
                Log in with your IDIR, HA ID or BCeID to the Health Career Access Program Employer
                Portal.
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
            <StyledEmployerAlert severity='info'>
              If you're a participant,&nbsp;
              <b>
                <Link href={PEOI_LINK} target='_blank'>
                  click here
                </Link>
              </b>
              &nbsp;to login to the participant portal
            </StyledEmployerAlert>
          </Box>
        </StyledEmployerLoginBox>
      </Box>
    </Page>
  );
};
