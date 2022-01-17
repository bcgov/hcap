import React from 'react';
import { styled } from '@mui/material/styles';
import classNames from 'classnames';
import Typography from '@mui/material/Typography';
import MuiCard from '@mui/material/Card';
const PREFIX = 'Card';

const classes = {
  root: `${PREFIX}-root`,
  title: `${PREFIX}-title`,
  noPadding: `${PREFIX}-noPadding`,
  noShadow: `${PREFIX}-noShadow`,
};

const StyledMuiCard = styled(MuiCard)(({ theme }) => ({
  [`&.${classes.root}`]: {
    overflow: 'initial',
    padding: theme.spacing(4),
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 5px 0 #E5E9F2',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
  },

  [`& .${classes.title}`]: {
    textAlign: 'center',
    marginBottom: theme.spacing(3),
  },

  [`&.${classes.noPadding}`]: {
    padding: 0,
  },

  [`&.${classes.noShadow}`]: {
    boxShadow: 'none',
  },
}));

export const Card = ({ children, title, noPadding, noShadow, className, ...props }) => {
  return (
    <StyledMuiCard
      className={classNames(
        classes.root,
        {
          [classes.noPadding]: noPadding,
          [classes.noShadow]: noShadow,
        },
        className
      )}
      {...props}
    >
      {title && (
        <Typography className={classes.title} variant='h3' noWrap>
          {title}
        </Typography>
      )}
      {children}
    </StyledMuiCard>
  );
};
