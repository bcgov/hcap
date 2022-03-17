import React from 'react';
import Typography from '@material-ui/core/Typography';

export const InputFieldLabel = ({ label, boldLabel, ...props }) => {
  return (
    <Typography variant={boldLabel ? 'subtitle2' : 'body1'} {...props}>
      {label}
    </Typography>
  );
};
