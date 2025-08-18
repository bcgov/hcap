import { Page } from '../../components/generic';
import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { API_URL } from '../../constants';

import { Typography, Icon } from '@mui/material';
import { Button } from '../../components/generic/Button';
import { Card } from '../../components/generic/Card';
import Box from '@mui/material/Box';

import {
  confirmInterestDefault,
  confirmInterestError,
  confirmInterestSuccess,
  confirmInterestLoading,
} from '../../constants/confirmInterestConstants';

const StyledCard = styled(Card)(() => ({
  marginTop: 100,
  width: 376,
  height: 270,
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
  alignSelf: 'center',
  color: theme.palette.primary.dark,
}));

const StyledCheckIcon = styled(Icon)(() => ({
  alignSelf: 'center',
  marginBottom: 10,
  color: 'green',
}));

const StyledErrorIcon = styled(Icon)(() => ({
  alignSelf: 'center',
  marginBottom: 10,
  color: 'red',
}));

export default (props) => {
  const [state, setState] = useState(confirmInterestLoading);
  // Get the query string from the url
  // Remove the questionmark from the search
  const { location, navigate } = props;
  const query = Object.fromEntries(new URLSearchParams(location.search));

  useEffect(() => {
    const checkId = async () => {
      const res = await fetch(`${API_URL}/api/v1/participants/confirm-interest?id=${query.id}`, {
        method: 'GET',
      });
      setTimeout(() => {
        if (res.ok) {
          setState(confirmInterestDefault);
        } else {
          setState(confirmInterestError);
        }
      }, 500);
    };
    if (!query.id) {
      navigate('/');
    } else {
      checkId();
    }
  }, [navigate, query.id]);

  const handleCheckToken = async () => {
    setState(confirmInterestLoading);
    const res = await fetch(`${API_URL}/api/v1/participants/confirm-interest?id=${query.id}`, {
      method: 'POST',
    });
    setTimeout(() => {
      if (res.ok) {
        setState(confirmInterestSuccess);
      } else {
        setState(confirmInterestError);
      }
    }, 500);
  };

  if (!state) return null;

  const getIconComponent = () => {
    if (state.iconClass === 'icon') {
      return <StyledIcon component={state.icon} fontSize={'large'} />;
    } else if (state.iconClass === 'check') {
      return <StyledCheckIcon component={state.icon} fontSize={'large'} />;
    } else if (state.iconClass === 'error') {
      return <StyledErrorIcon component={state.icon} fontSize={'large'} />;
    }
    return <Icon component={state.icon} fontSize={'large'} />;
  };

  return (
    <Page
      hideEmployers={
        !window.location.hostname.includes('dev.') && !window.location.hostname.includes('test.')
      }
    >
      <StyledCard>
        <Box display='flex' flexDirection='column' height='100%' justifyContent='center'>
          {getIconComponent()}
          <Typography sx={{ marginBottom: '10px' }} variant={'h3'} align={'center'}>
            {state.title}
          </Typography>
          <Typography variant={'body1'} align={'center'}>
            {state.description}
          </Typography>
          {state.buttonText ? (
            <Box sx={{ marginTop: '10px' }}>
              <Button text={state.buttonText} onClick={handleCheckToken} />
            </Box>
          ) : null}
        </Box>
      </StyledCard>
    </Page>
  );
};
