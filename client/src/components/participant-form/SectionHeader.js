import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { Divider } from '../generic';

export const SectionHeader = ({ text }) => {
  return (
    <Grid item xs={12}>
      <Typography variant='subtitle2'>
        {text}
        <Divider />
      </Typography>
    </Grid>
  );
};
