import React from 'react';
import { Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: theme.typography.body1.fontSize,
  },
  arrow: {
    color: theme.palette.common.white,
  },
}));

export const ComponentTooltip = ({
  ...props
}) => {
  const classes = useStyles();
  return (
    <Tooltip
      classes={{ tooltip: classes.tooltip, arrow: classes.arrow }}
      interactive={true}
      {...props}
    />
  )
};