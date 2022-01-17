import React from 'react';
import FormHelperText from '@mui/material/FormHelperText';

export const InputFieldError = ({ error, ...props }) => {
  return (
    <FormHelperText error {...props}>
      {error}
    </FormHelperText>
  );
};
