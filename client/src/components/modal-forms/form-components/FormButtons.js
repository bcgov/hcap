import React from 'react';
import { Box, Divider, styled } from '@mui/material';
import { Button } from '../../generic';

const FormButton = styled(Button)(({ theme }) => ({
  maxWidth: '200px',
}));

const FormDivider = styled(Divider)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

export const FormButtons = ({ onSubmit, onClose }) => {
  return (
    <>
      <FormDivider />
      <Box display='flex' justifyContent='space-between'>
        <FormButton onClick={onClose} variant='outlined' text='Cancel' />
        <FormButton text='Confirm' type='submit' />
      </Box>
    </>
  );
};
