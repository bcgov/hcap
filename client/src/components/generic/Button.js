import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import MuiButton from '@mui/material/Button';

export const Button = ({ text, loading, disabled, size, fullWidth = true, ...props }) => {
  const getSizeStyles = (size) => {
    switch (size) {
      case 'small':
        return {
          height: '30px',
          fontSize: '13px',
          lineHeight: '16px',
        };
      case 'large':
        return {
          height: '52px',
        };
      default:
        return {
          height: '42px',
        };
    }
  };

  return (
    <MuiButton
      disabled={loading || disabled}
      variant='contained'
      color='primary'
      fullWidth={fullWidth}
      size={size}
      sx={getSizeStyles(size)}
      {...props}
    >
      {loading ? <CircularProgress size={24} /> : text}
    </MuiButton>
  );
};
