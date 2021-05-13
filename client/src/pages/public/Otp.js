import { Page } from '../../components/generic';
import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import ContactMailIcon from '@material-ui/icons/ContactMail';
import * as qs from 'querystring';
import InfoIcon from '@material-ui/icons/Info';
import { Typography } from '@material-ui/core';
import { Button } from '../../components/generic/Button';
import { Card } from '../../components/generic/Card';
import Box from '@material-ui/core/Box';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

const useStyles = makeStyles((theme) => {
  return {
    root: {
      marginTop: 100,
      width: 376,
      height: 270,
    },
    title: {
      paddingBottom: 10,
    },
    button: {
      paddingTop: 10,
      justifySelf: 'flex-end',
      alignItems: 'flex-end',
    },
    icon: {
      alignSelf: 'center',
      paddingBottom: 10,
      color: theme.palette.primary.dark,
    },
    check: {
      alignSelf: 'center',
      paddingBottom: 10,
      color: 'green',
    },
    error: {
      alignSelf: 'center',
      paddingBottom: 10,
      color: 'red',
    },
  };
});

export default (props) => {
  const [pageState, setPageState] = useState('default');
  const classes = useStyles();
  // Get the query string from the url
  // Remove the questionmark from the search
  const query = qs.parse(props.location.search.slice(1), '&', '=');
  const handleCheckToken = () => {
    //Send off request to back with the token
    if (query?.otp === 'success') {
      setPageState('success');
    } else {
      setPageState('error');
    }
  };
  return (
    <Page hideEmployers={true}>
      <Card className={classes.root}>
        {pageState === 'default' && (
          <Box display='flex' flexDirection='column'>
            <ContactMailIcon className={classes.icon} fontSize={'large'} />
            <Typography className={classes.title} variant={'h3'} align={'center'}>
              Confirm Interest
            </Typography>
            <Typography variant={'body1'} align={'center'}>
              Please click on the "Confirm Interest" button to confirm that you are still interested
              in participating in the Health Career Access Program
            </Typography>
            <Box className={classes.button}>
              <Button text={'Confirm Interest'} onClick={handleCheckToken} />
            </Box>
          </Box>
        )}
        {pageState === 'success' && (
          <Box display='flex' flexDirection='column'>
            <CheckBoxIcon className={classes.check} fontSize={'large'} />
            <Typography className={classes.title} variant={'h3'} align={'center'}>
              Thanks For Letting Us Know
            </Typography>
            <Typography variant={'body1'} align={'center'}>
              You have succesfully confirmed your interest. To view your current status, you can log
              into the HCAP application
            </Typography>
            <Box className={classes.button}>
              <Button component={Link} text={'Ok'} to='/' />
            </Box>
          </Box>
        )}
        {pageState === 'error' && (
          <Box display='flex' flexDirection='column'>
            <InfoIcon className={classes.error} fontSize={'large'} />
            <Typography className={classes.title} variant={'h3'} align={'center'}>
              Expired Link
            </Typography>
            <Typography variant={'body1'} align={'center'}>
              This link has expired as your interest has already been confirmed.
            </Typography>
            <Box className={classes.button}>
              <Button component={Link} text={'Close'} to='/' />
            </Box>
          </Box>
        )}
      </Card>
    </Page>
  );
};
