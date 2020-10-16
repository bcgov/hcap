import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField } from '../fields';
import { Box } from '@material-ui/core';

export const StaffingChallenges = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Comments and Description of Staffing Challenges
          </Typography>
          <Divider />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="staffingChallenges"
            component={RenderTextField}
            label="Please use this space to explain any staffing challenges you may be facing at this site"
            multiline
            rows={5}
            disabled={isDisabled}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
