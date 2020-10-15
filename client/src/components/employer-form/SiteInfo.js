import React, { Fragment, useEffect } from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField, useFormikContext } from 'formik';

import { Card, Divider } from '../generic';
import { RenderRadioGroup, RenderSelectField, RenderTextField } from '../fields';

export const SiteInfo = ({ isDisabled }) => {
  const { values } = useFormikContext();

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        {/** Site Basic information */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Site Information
          </Typography>
          <Divider />
        </Grid>
        <Box pt={1} pb={2} pl={2} pr={2}>
          <Typography variant="body1">
            This section collects general business information on the site including location, type, and size. Operators/managers
            must submit one form per site.
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
        <Grid item xs={12}>
          <FastField
            name="siteType"
            component={RenderRadioGroup}
            label="* Site type"
            disabled={isDisabled}
            options={[
              { value: 'Long-term care', label: 'Long-term care' },
              { value: 'Assisted living', label: 'Assisted living' },
              { value: 'Both', label: 'Both' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </Grid>
        {/**  Other site type */}
        {values.siteType === 'Other' && (
          <Fragment>
            <Grid item xs={12} md={6}>
              <FastField
                name="otherSite"
                component={RenderTextField}
                label="* Please specify"
                disabled={isDisabled}
              />
            </Grid>
          </Fragment>
        )}

        {/** Site Size Info */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Site Size Information
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPublicLongTermCare"
            type="number"
            component={RenderTextField}
            label="* Number of publicly funded long-term care beds"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPrivateLongTermCare"
            type="number"
            component={RenderTextField}
            label="* Number of privately funded long-term care beds"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPublicAssistedLiving"
            type="number"
            component={RenderTextField}
            label="* Number of publicly funded assisted living beds"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPrivateAssistedLiving"
            type="number"
            component={RenderTextField}
            label="* Number of privately funded assisted living beds"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="comment"
            component={RenderTextField}
            label="Comments (optional)"
            multiline
            rows={5}
            disabled={isDisabled}
          />
        </Grid>

        {/** Site Contact Info */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Site Contact Information
          </Typography>
          <Divider />
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
            name="phoneNumber"
            type="tel"
            component={RenderTextField}
            label="* Phone number"
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
      </Grid>
    </Card>
  );
};
