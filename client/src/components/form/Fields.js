import React from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { FastField, Field } from 'formik';

import { Card } from '../generic';
import { RenderTextField, RenderRadioGroup } from '../fields';

export const Fields = ({ isDisabled }) => {

  return (
    <Card noPadding={isDisabled} noShadow={isDisabled}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Check Your Eligibility
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <b>Please note:</b> A criminal record check is required for most positions in the health sector.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <b>* Are you a Canadian citizen, permanent resident or <Link href="https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/eligibility.html" target="__blank" rel="noreferrer noopener">otherwise legally eligible to work in Canada?</Link></b>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Field
            name="eligibility"
            component={RenderRadioGroup}
            disabled={isDisabled}
            row
            options={[
              { value: true, label: 'Yes' },
              { value: false, label: 'No' },
            ]}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Provide Your Contact Information
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
            name="emailAddress"
            component={RenderTextField}
            label="Email Address"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="postalCode"
            component={RenderTextField}
            label="Postal Code"
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </Card>
  );
};