import React from 'react';

import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Button } from '../../generic';

const useStyles = makeStyles((theme) => ({
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
}));

export const FormButtons = ({ onSubmit, onClose }) => {
  const classes = useStyles();

  return (
    <>
      <Divider className={classes.formDivider} />
      <Box display='flex' justifyContent='space-between'>
        <Button className={classes.formButton} onClick={onClose} variant='outlined' text='Cancel' />
        <Button className={classes.formButton} text='Confirm' type='submit' />
      </Box>
    </>
  );
};
