import { Page } from '../../components/generic';
import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import * as qs from 'querystring';

import { Typography, Icon } from '@material-ui/core';
import { Button } from '../../components/generic/Button';
import { Card } from '../../components/generic/Card';
import Box from '@material-ui/core/Box';

import {
  confirmInterestDefault,
  confirmInterestError,
  confirmInterestSuccess,
} from '../../constants/confirmInterestConstants';

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
  const [state, setState] = useState(confirmInterestDefault);
  const classes = useStyles();
  // Get the query string from the url
  // Remove the questionmark from the search
  const query = qs.parse(props.location.search.slice(1), '&', '=');
  const handleCheckToken = () => {
    //Send off request to back end to validate token
    if (query?.otp === 'success') {
      setState(confirmInterestSuccess);
    } else {
      setState(confirmInterestError);
    }
  };
  return (
    <Page hideEmployers={true}>
      <Card className={classes.root}>
        <Box display='flex' flexDirection='column'>
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
