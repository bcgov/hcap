import React from 'react';
import { styled } from '@mui/material/styles';
import classNames from 'classnames';
const PREFIX = 'Divider';

const classes = {
  divider: `${PREFIX}-divider`,
  light: `${PREFIX}-light`,
};

const Root = styled('hr')(() => ({
  [`&.${classes.divider}`]: {
    height: '3px',
    backgroundColor: '#E2A014',
    color: '#E2A014',
    borderStyle: 'solid',
  },

  [`&.${classes.light}`]: {
    backgroundColor: '#efefef',
    color: '#efefef',
    height: '1px',
  },
}));

export const Divider = ({ isLight }) => {
  return <Root className={classNames(classes.divider, { [classes.light]: isLight })} />;
};
