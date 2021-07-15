import React from 'react';
import { useHistory } from 'react-router-dom';
import { Typography, Grid, Button } from '@material-ui/core';
import { Page } from '../../components/generic';
import { Routes } from '../../constants';

export default () => {
  const history = useHistory();
  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
      <Grid container spacing={-4} justify='center' alignContent='center' direction='column'>
        <Typography variant='h5'>You have withdrawn from HCAP</Typography>
        <Typography variant='body1'>
          You have successfully withdrawn from the program. Please click on the button below to view
          other Express of Interest forms that you have
        </Typography>
        <Grid item xs={6}>
          <Button
            color='secondary'
            variant='contained'
            onClick={() => history.push(Routes.ParticipantLanding)}
          >
            View other Express of Interest
          </Button>
        </Grid>
      </Grid>
    </Page>
  );
};
