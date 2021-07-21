import { Page } from '../../components/generic';
import React from 'react';
import { Button, Typography, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Routes } from '../../constants';
import { useHistory, useParams } from 'react-router-dom';
const useStyles = makeStyles((theme) => ({
  button: {
    backgroundColor: '#009BDD',
    marginTop: '10px',
    color: 'white',
    padding: '25px',
    paddingTop: '10px',
    paddingBottom: '10px',
  },
  buttonBoxes: {
    alignSelf: 'center',
  },
  textBoxes: {
    marginTop: '200px',
  },
}));

export default () => {
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();
  const handleBackCLick = () => {
    if (id) {
      return history.push(Routes.ParticipantEOI.replace(':id', id));
    } else {
      return history.push(Routes.ParticipantLanding);
    }
  };

  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
      <Grid container spacing={4} justify='center' alignContent='center' direction='column'>
        <Grid className={classes.textBoxes} item>
          <Typography variant={'h2'}>Successfully Confirmed Interest</Typography>
          <Typography>
            You have successfully confirmed your interest and status with HCAP
          </Typography>
        </Grid>
        <Grid className={classes.buttonBoxes} item>
          <Button className={classes.button} variant={'contained'} onClick={handleBackCLick}>
            View Expression of Interest
          </Button>
        </Grid>
      </Grid>
    </Page>
  );
};
