import { Page } from '../../components/generic';
import React from 'react';
import { Button, Typography, Box } from '@material-ui/core';
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
  const handleBackClick = () => {
    if (id) {
      return history.push(Routes.ParticipantEOI.replace(':id', id));
    } else {
      return history.push(Routes.ParticipantLanding);
    }
  };

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
        <Button className={classes.button} variant={'contained'} onClick={handleBackClick}>
          Go Back
        </Button>
      </Box>
    </Page>
  );
};
