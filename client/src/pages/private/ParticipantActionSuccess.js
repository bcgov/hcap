import { Page } from '../../components/generic';
import { styled } from '@mui/material/styles';
import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { Routes } from '../../constants';
import { useHistory, useParams } from 'react-router-dom';

const PREFIX = 'ParticipantActionSuccess';

const classes = {
  button: `${PREFIX}-button`,
  buttonBoxes: `${PREFIX}-buttonBoxes`,
  textBoxes: `${PREFIX}-textBoxes`,
};

const StyledPage = styled(Page)(({ theme }) => ({
  [`& .${classes.button}`]: {
    backgroundColor: '#009BDD',
    marginTop: '10px',
    color: 'white',
    padding: '25px',
    paddingTop: '10px',
    paddingBottom: '10px',
  },

  [`& .${classes.buttonBoxes}`]: {
    alignSelf: 'center',
  },

  [`& .${classes.textBoxes}`]: {
    marginTop: '200px',
  },
}));

export default () => {
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
    <StyledPage
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
    </StyledPage>
  );
};
