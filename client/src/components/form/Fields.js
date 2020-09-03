import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card } from '../generic';
import { RenderTextField } from '../fields';

export const Fields = ({ isDisabled }) => {

  return (
    <Card noPadding={isDisabled} noShadow={isDisabled}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Information
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="firstName"
            component={RenderTextField}
            label="First Name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="lastName"
            component={RenderTextField}
            label="Last Name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="phoneNumber"
            component={RenderTextField}
            label="Phone Number"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="alternatePhoneNumber"
            component={RenderTextField}
            label="Alternate phone number (optional)"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="emailAddress"
            component={RenderTextField}
            label="E-mail Address"
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </Card>
  );
};