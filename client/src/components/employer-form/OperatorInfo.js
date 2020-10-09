import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField } from '../fields';

export const OperatorInfo = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Operator Information
          </Typography>
          <Divider />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="operatorName"
            component={RenderTextField}
            label="* Operator Name:"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="operatorEmail"
            type="email"
            component={RenderTextField}
            label="* Operator Contact Email Address:"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="operatorPhone"
            type="tel"
            component={RenderTextField}
            label="* Operator Contact Phone Number:"
            disabled={isDisabled}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
