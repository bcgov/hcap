import React, { Fragment } from 'react';

import { Box, Divider, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Button } from '../generic';

const useStyles = makeStyles((theme) => ({
  formText: {
    fontWeight: 400,
  },
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(4),
  },
}));

export const ProspectingForm = ({ name, onClose, onSubmit }) => {
  const classes = useStyles();

  return (
    <Fragment>
      <Typography variant='subtitle2' className={classes.formText}>
        {name} has been engaged. This candidate can now be found in the My Candidates tab.
      </Typography>

      <Divider className={classes.formDivider} />

      <Box display='flex' justifyContent='space-between'>
        <Button className={classes.formButton} onClick={onClose} variant='outlined' text='Close' />
        <Button
          className={classes.formButton}
          onClick={onSubmit}
          variant='contained'
          color='primary'
          text='View My Candidates'
        />
      </Box>
    </Fragment>
  );
};
