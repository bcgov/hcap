import { Page } from '../../components/generic';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../../constants';

import * as qs from 'query-string';

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

const PREFIX = 'ConfirmInterest';

const classes = {
  root: `${PREFIX}-root`,
  title: `${PREFIX}-title`,
  button: `${PREFIX}-button`,
  icon: `${PREFIX}-icon`,
  check: `${PREFIX}-check`,
  error: `${PREFIX}-error`,
};

const StyledPage = styled(Page)(({ theme }) => {
  return {
    [`& .${classes.root}`]: {
      marginTop: 100,
      width: 376,
      height: 270,
    },
    [`& .${classes.title}`]: {
      marginBottom: 10,
    },
    [`& .${classes.button}`]: {
      marginTop: 10,
    },
    [`& .${classes.icon}`]: {
      alignSelf: 'center',
      color: theme.palette.primary.dark,
    },
    [`& .${classes.check}`]: {
      alignSelf: 'center',
      marginBottom: 10,
      color: 'green',
    },
    [`& .${classes.error}`]: {
      alignSelf: 'center',
      marginBottom: 10,
      color: 'red',
    },
  };
});

export default (props) => {
  const [state, setState] = useState(confirmInterestLoading);

  // Get the query string from the url
  // Remove the questionmark from the search
  const query = qs.parse(props.location.search.slice(1), '&', '=');

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
      props.history.push('/');
    } else {
      checkId();
    }
  }, [props.history, query.id]);

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

  return (
    <StyledPage hideEmployers={!window.location.hostname.includes('freshworks.club')}>
      <Card className={classes.root}>
        <Box display='flex' flexDirection='column' height='100%' justifyContent='center'>
          <Icon component={state.icon} className={classes[state.iconClass]} fontSize={'large'} />
          <Typography className={classes.title} variant={'h3'} align={'center'}>
            {state.title}
          </Typography>
          <Typography variant={'body1'} align={'center'}>
            {state.description}
          </Typography>
          {state.buttonText ? (
            <Box className={classes.button}>
              <Button text={state.buttonText} onClick={handleCheckToken} />
            </Box>
          ) : null}
        </Box>
      </Card>
    </StyledPage>
  );
};
