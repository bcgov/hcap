import React from 'react';
import classNames from 'classnames';
import Typography from '@mui/material/Typography';
import MuiCard from '@mui/material/Card';

export const Card = ({ children, title, noPadding, noShadow, className, ...props }) => {
  return (
    <MuiCard
      className={classNames(className)}
      sx={{
        overflow: 'initial',
        padding: noPadding ? 0 : { xs: 2, sm: 4 },
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        boxShadow: noShadow ? 'none' : '0 0 5px 0 #E5E9F2',
      }}
      {...props}
    >
      {title && (
        <Typography
          variant='h3'
          noWrap
          sx={{
            textAlign: 'center',
            marginBottom: 3,
          }}
        >
          {title}
        </Typography>
      )}
      {children}
    </MuiCard>
  );
};
