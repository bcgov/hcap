import React from 'react';
import { useHistory } from 'react-router-dom';
import { Typography, Button, Box } from '@material-ui/core';
import { Page } from '../../components/generic';
import { Routes } from '../../constants';

export default () => {
  const history = useHistory();
  return (
    <Page
      hideEmployers={!window.location.hostname.includes('freshworks.club')}
      isAutoHeight={false}
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
          onClick={() => history.push(Routes.ParticipantLanding)}
        >
          Return to Home
        </Button>
      </Box>
    </Page>
  );
};
