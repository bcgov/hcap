import React from 'react';

import { Box, Typography } from '@material-ui/core';

import { Dialog } from '../../generic';
import { FormButtons } from './';

export const ConfirmationDialog = ({ isOpen, onSubmit, onClose, warningMessage }) => {
  return (
    <Dialog title='Confirm your changes' open={isOpen} onClose={onClose}>
      {warningMessage && <Typography variant='body1'>{warningMessage}</Typography>}

      <Box my={2}>
        <FormButtons onClose={onClose} onSubmit={onSubmit} />
      </Box>
    </Dialog>
  );
};
