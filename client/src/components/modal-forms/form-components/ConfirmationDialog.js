import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import { Button, Dialog } from '../../generic';

const ConfirmationButton = styled(Button)({
  maxWidth: '200px',
});

export const ConfirmationDialog = ({ isOpen, handleConfirmation, onClose, warningMessage }) => {
  return (
    <Dialog title='Confirm your changes' open={isOpen} onClose={onClose}>
      {warningMessage && <Typography variant='body1'>{warningMessage}</Typography>}

      <Box my={2} display='flex' justifyContent='space-between'>
        <ConfirmationButton onClick={onClose} variant='outlined' text='Cancel' />
        <ConfirmationButton onClick={handleConfirmation} text='Confirm' />
      </Box>
    </Dialog>
  );
};
