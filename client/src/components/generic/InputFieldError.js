import React from 'react';
import FormHelperText from '@material-ui/core/FormHelperText';

export const InputFieldError = ({ error, ...props }) => {
  return (
    <FormHelperText error {...props}>
      {error}
    </FormHelperText>
  );
};
