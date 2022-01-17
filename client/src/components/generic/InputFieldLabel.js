import React from 'react';
import Typography from '@mui/material/Typography';

export const InputFieldLabel = ({ label, ...props }) => {
  return (
    <Typography variant='body1' {...props}>
      {label}
    </Typography>
  );
};
