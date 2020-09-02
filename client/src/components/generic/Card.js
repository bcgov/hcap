import React from 'react';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import MuiCard from '@material-ui/core/Card';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    overflow: 'initial',
    padding: theme.spacing(4),
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 5px 0 #E5E9F2',
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(2),
    },
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing(3),
  },
  noPadding: {
    padding: 0,
  },
  noShadow: {
    boxShadow: 'none',
  },
}));

export const Card = ({ children, title, noPadding, noShadow, className, ...props }) => {
  const classes = useStyles();
  return (
    <MuiCard
      className={classNames(classes.root, {
        [classes.noPadding]: noPadding,
        [classes.noShadow]: noShadow,
      }, className)}
      {...props}
    >
      {title && <Typography className={classes.title} variant="h3" noWrap>{title}</Typography>}
      {children}
    </MuiCard>
  )
};
