import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Box } from '@mui/material';
import { Page } from '../../components/generic';
import { Routes } from '../../constants';

export default () => {
  const navigate = useNavigate();
  return (
    <Page
      hideEmployers={
        !window.location.hostname.includes('dev.') && !window.location.hostname.includes('test.')
      }
    >
      <Box
        container
        justifyContent='center'
        alignItems='center'
        display='flex'
        flexDirection='column'
        minHeight='100%'
      >
        <Box
          mb={2}
          justifyContent='center'
          display='flex'
          flexDirection='column'
          maxWidth='500px'
          textAlign='center'
        >
          <Typography variant='h2' component='h1'>
            You have successfully withdrawn this PEOI from the program.
          </Typography>
        </Box>
        <Button
          color='secondary'
          variant='contained'
          onClick={() => navigate(Routes.ParticipantLanding)}
        >
          Return Home
        </Button>
      </Box>
    </Page>
  );
};
