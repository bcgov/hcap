import React from 'react';

import { Box, Typography } from '@material-ui/core';

import { Dialog } from '../../generic';
import { FormButtons } from './';

export const ConfirmationForm = ({ isOpen, onSubmit, onClose }) => {
  return (
    <Dialog title='Confirm your changes' open={isOpen} onClose={onClose}>
      <Typography variant='body1'>
        You are making changes to this record, please ensure that all data inputted is accurate
      </Typography>

      <Box my={2}>
        <FormButtons onClose={onClose} onSubmit={onSubmit} />
      </Box>
    </Dialog>
  );
};
