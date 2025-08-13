import { Page } from '../../components/generic';
import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { Routes } from '../../constants';
import { useNavigate, useParams } from 'react-router-dom';

export default () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBackClick = () => {
    if (id) {
      return navigate(Routes.ParticipantEOI.replace(':id', id));
    } else {
      return navigate(Routes.ParticipantLanding);
    }
  };

  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
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
          px={1}
          justifyContent='center'
          display='flex'
          flexDirection='column'
          maxWidth='500px'
          textAlign='center'
        >
          <Typography variant={'h2'}>Successfully Confirmed Interest</Typography>
          <Typography>
            You have successfully confirmed your interest and status with HCAP
          </Typography>
        </Box>
        <Button
          sx={{
            backgroundColor: '#009BDD',
            marginTop: '10px',
            color: 'white',
            padding: '25px',
            paddingTop: '10px',
            paddingBottom: '10px',
          }}
          variant={'contained'}
          onClick={handleBackClick}
        >
          Go Back
        </Button>
      </Box>
    </Page>
  );
};
