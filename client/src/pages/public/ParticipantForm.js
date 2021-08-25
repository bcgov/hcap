import React from 'react';
import store from 'store';
import { Page } from '../../components/generic';
import { Typography, Box, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import { Form } from '../../components/participant-form';

const useStyles = makeStyles((theme) => ({
  info: {
    color: 'rgb(13, 60, 97)',
    backgroundColor: 'rgb(232, 244, 253)',
    borderRadius: '4px',
    border: '1px solid rgb(175, 217, 252)',
    maxWidth: '800px',
  },
  icon: {
    color: theme.palette.primary.dark,
  },
}));
export default () => {
  const classes = useStyles();
  const appEnv = store.get('APP_ENV') || 'prod';
  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
      {appEnv === 'prod' ? (
        <Box mt={4} m={2} py={1} px={2} display='flex' alignItems='center' className={classes.info}>
          <Icon mx={2} component={InfoIcon} className={classes.icon} fontSize={'large'} />
          <Typography>
            The participant expression of interest for the HCAP program is now closed and may reopen
            as more opportunities become available. Thank you for your interest in the program.
          </Typography>
        </Box>
      ) : (
        <Form />
      )}
    </Page>
  );
};
