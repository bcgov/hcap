import React from 'react';

import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Button } from '../../generic';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
}));

export const FormButtons = ({ onSubmit, onClose }) => {
  const classes = useStyles();

  return (
    <Box display='flex' justifyContent='space-between'>
      <Button className={classes.formButton} onClick={onClose} variant='outlined' text='Cancel' />
      <Button className={classes.formButton} onClick={onSubmit} text='Confirm' />
    </Box>
  );
};
