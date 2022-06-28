import React from 'react';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  divider: {
    height: '3px',
    backgroundColor: theme.palette.secondary.light,
    color: theme.palette.secondary.light,
    borderStyle: 'solid',
  },
  light: {
    backgroundColor: '#efefef',
    color: '#efefef',
    height: '1px',
  },
}));

export const Divider = ({ isLight }) => {
  const classes = useStyles();
  return <hr className={classNames(classes.divider, { [classes.light]: isLight })} />;
};
