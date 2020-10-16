import React from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderSelectField, RenderTextField } from '../fields';

export const SiteContactInfo = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Site Contact Information
          </Typography>
          <Divider />
        </Grid>
        <Box pt={1} pb={2} pl={2} pr={2}>
          <Typography variant="body1">
            Please complete <b>one Expression of Interest form for each site</b> that may be
            interested in participating in the Health Career Access Program.
          </Typography>
        </Box>
        <Grid item xs={12} sm={6}>
          <FastField
            name="siteName"
            component={RenderTextField}
            label="* Site name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="address"
            component={RenderTextField}
            label="* Site address"
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
        <Grid item xs={12} md={6}>
          <FastField
            name="geographicRegion"
            component={RenderSelectField}
            label="* Geographic region"
            disabled={isDisabled}
            options={[
              { value: 'Interior', label: 'Interior Health' },
              { value: 'Fraser', label: 'Fraser Health' },
              { value: 'Vancouver Coastal', label: 'Vancouver Coastal Health' },
              { value: 'Vancouver Island', label: 'Vancouver Island Health' },
              { value: 'Northern', label: 'Northern Health' },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="siteContactFirstName"
            component={RenderTextField}
            label="* First name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="siteContactLastName"
            component={RenderTextField}
            label="* Last name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="emailAddress"
            type="email"
            component={RenderTextField}
            label="* Email address"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="phoneNumber"
            type="tel"
            component={RenderTextField}
            label="* Phone number"
            disabled={isDisabled}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
