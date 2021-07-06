import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { Page } from '../../components/generic';
export default () => {
  return (
    <Page>
      <Grid container alignItems='center' justify='center'>
        <Typography variant='subtitle2'>Logged in!</Typography>
      </Grid>
    </Page>
  );
};
