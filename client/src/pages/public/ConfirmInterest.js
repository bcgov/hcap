import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import * as qs from 'querystring';
import { Typography, Icon } from '@material-ui/core';
import Box from '@material-ui/core/Box';

import { Button, Card, Page } from '../../components/generic';
import {
  confirmInterestDefault,
  confirmInterestError,
  confirmInterestSuccess,
  confirmInterestLoading,
} from '../../constants/confirmInterestConstants';
import { axiosInstance } from '../../services/api';

const useStyles = makeStyles((theme) => {
  return {
    root: {
      marginTop: 100,
      width: 376,
      height: 270,
    },
    title: {
      marginBottom: 10,
    },
    button: {
      marginTop: 10,
    },
    icon: {
      alignSelf: 'center',
      color: theme.palette.primary.dark,
    },
    check: {
      alignSelf: 'center',
      marginBottom: 10,
      color: 'green',
    },
    error: {
      alignSelf: 'center',
      marginBottom: 10,
      color: 'red',
    },
  };
});

export default (props) => {
  const [state, setState] = useState(confirmInterestLoading);
  const classes = useStyles();
  // Get the query string from the url
  // Remove the questionmark from the search
  const query = qs.parse(props.location.search.slice(1), '&', '=');

  useEffect(() => {
    const checkId = async () => {
      let confirm = confirmInterestDefault;
      try {
        await axiosInstance.get(`/participants/confirm-interest?id=${query.id}`);
      } catch {
        confirm = confirmInterestError;
      }
      setTimeout(() => setState(confirm), 500);
    };
    if (!query.id) {
      props.history.push('/');
    } else {
      checkId();
    }
  }, [props.history, query.id]);

  const handleCheckToken = async () => {
    setState(confirmInterestLoading);
    let confirm = confirmInterestSuccess;
    try {
      await axiosInstance.post(`/participants/confirm-interest?id=${query.id}`);
    } catch {
      confirm = confirmInterestError;
    }
    setTimeout(() => setState(confirm), 500);
  };

  if (!state) return null;

  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
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
    </Page>
  );
};
