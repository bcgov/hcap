import React from 'react';
import Typography from '@mui/material/Typography';

export const InputFieldLabel = ({ label, boldLabel, ...props }) => {
  return (
    <Typography variant={boldLabel ? 'subtitle2' : 'body1'} {...props}>
      {label}
    </Typography>
  );
};
