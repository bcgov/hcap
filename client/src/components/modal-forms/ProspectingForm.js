import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';

export const ProspectingForm = ({ name, onClose, onSubmit }) => {
  return (
    <Fragment>
      <Box>{name} has been engaged. This candidate can now be found in the My Candidates tab.</Box>
      <Box mt={3}>
        <Grid container spacing={2} justify='flex-end'>
          <Grid item>
            <Button onClick={onClose} color='default' text='Close' />
          </Grid>
          <Grid item>
            <Button
              onClick={onSubmit}
              variant='contained'
              color='primary'
              text='View My Candidates'
            />
          </Grid>
        </Grid>
      </Box>
    </Fragment>
  );
};
