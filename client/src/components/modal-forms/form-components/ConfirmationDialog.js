import React from 'react';

import { Box, makeStyles, Typography } from '@material-ui/core';
import { Button, Dialog } from '../../generic';

const useStyles = makeStyles(() => ({
  confirmationButton: {
    maxWidth: '200px',
  },
}));

export const ConfirmationDialog = ({ isOpen, handleConfirmation, onClose, warningMessage }) => {
  const classes = useStyles();
  return (
    <Dialog title='Confirm your changes' open={isOpen} onClose={onClose}>
      {warningMessage && <Typography variant='body1'>{warningMessage}</Typography>}

      <Box my={2} display='flex' justifyContent='space-between'>
        <Button
          className={classes.confirmationButton}
          onClick={onClose}
          variant='outlined'
          text='Cancel'
        />
        <Button
          className={classes.confirmationButton}
          onClick={handleConfirmation}
          text='Confirm'
        />
      </Box>
    </Dialog>
  );
};
