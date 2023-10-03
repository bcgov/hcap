import React from 'react';
import { Grid, Typography } from '@material-ui/core';

export const PleaseNoteBanner = ({ text }) => {
  return (
    <Grid item xs={12}>
      <Typography>
        <b>Please note:</b> {text}
      </Typography>
    </Grid>
  );
};
