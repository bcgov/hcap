import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField } from '../fields';
import { OrgBookSearch } from './OrgBookSearch';

export const WorkforceBaseline = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Provide Your Business Information
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
        <FastField
            name="registeredBusinessName"
            component={OrgBookSearch}
            label="* Registered Business Name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="address"
            component={RenderTextField}
            label="* Business address"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="postalCode"
            component={RenderTextField}
            label="* Postal code"
            disabled={isDisabled}
          />
        </Grid>        
      </Grid>
    </Card>
  );
};
