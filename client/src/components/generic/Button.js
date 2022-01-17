import React from 'react';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import MuiButton from '@mui/material/Button';
const PREFIX = 'Button';

const classes = {
  root: `${PREFIX}-root`,
  small: `${PREFIX}-small`,
  large: `${PREFIX}-large`,
};

const StyledMuiButton = styled(MuiButton)(() => ({
  [`& .${classes.root}`]: {
    height: '42px',
  },

  [`& .${classes.small}`]: {
    height: '30px',
    fontSize: '13px',
    lineHeight: '16px',
  },

  [`& .${classes.large}`]: {
    height: '52px',
  },
}));

export const Button = ({ text, loading, disabled, ...props }) => {
  return (
    <StyledMuiButton
      classes={{ root: classes.root, sizeSmall: classes.small, sizeLarge: classes.large }}
      disabled={loading || disabled}
      variant='contained'
      color='primary'
      fullWidth
      {...props}
    >
      {loading ? <CircularProgress size={24} /> : text}
    </StyledMuiButton>
  );
};
