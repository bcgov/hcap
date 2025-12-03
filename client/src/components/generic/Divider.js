import React from 'react';
import { styled } from '@mui/material/styles';

const StyledDivider = styled('hr')(({ theme, isLight }) => ({
  height: isLight ? '1px' : '3px',
  backgroundColor: isLight ? '#efefef' : theme.palette.secondary.light,
  color: isLight ? '#efefef' : theme.palette.secondary.light,
  borderStyle: 'solid',
}));

export const Divider = ({ isLight }) => {
  return <StyledDivider isLight={isLight} />;
};
