import React from 'react';
import { Grid, Typography } from '@material-ui/core';

export const Question = ({ text }) => {
  return (
    <Grid item xs={12}>
      <Typography>
        <b>{text}</b>
      </Typography>
    </Grid>
  );
};
