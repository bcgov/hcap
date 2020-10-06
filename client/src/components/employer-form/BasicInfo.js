import React from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField, RenderRadioGroup } from '../fields';
import { OrgBookSearch } from './OrgBookSearch';

const useStyles = makeStyles((theme) => ({
  line: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderTop: '2px solid rgb(204, 204, 204)',
  },
}));

export const BasicInfo = ({ isDisabled }) => {
  const classes = useStyles();

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        {/** Business information */}
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
            label="Registered Business Name"
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

        {/** Business Location */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Select Your Health Region
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="location"
            component={RenderRadioGroup}
            label="* Please select your business location's health region"
            disabled={isDisabled}
            options={[
              {
                value: 'Interior', label: (
                  <span>
                    Interior (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/1_interior_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Fraser', label: (
                  <span>
                    Fraser (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/2_fraser_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Vancouver Coastal', label: (
                  <span>
                    Vancouver Coastal (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/3_vancouver_coastal_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Vancouver Island', label: (
                  <span>
                    Vancouver Island (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/4_vancouver_island_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Northern', label: (
                  <span>
                    Northern (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/5_northern_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
            ]}
          />
        </Grid>

        {/** Contact Info */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Provide Primary Contact Information
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="firstName"
            component={RenderTextField}
            label="* First name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="lastName"
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
