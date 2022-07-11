import React, { Fragment } from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField, useFormikContext } from 'formik';

import { Card, Divider } from '../generic';
import { healthAuthorities } from '../../constants';
import { RenderSelectField, RenderTextField, RenderRadioGroup } from '../fields';

export const SiteInfo = ({ isDisabled }) => {
  const { values } = useFormikContext();

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant='subtitle2'>Site Contact Information</Typography>
          <Divider />
        </Grid>
        <Box pt={1} pb={2} pl={2} pr={2}>
          <Typography variant='body1'>
            Please complete <b>one Expression of Interest form for each site</b> that may be
            interested in participating in the Health Career Access Program.
          </Typography>
        </Box>
        <Grid item xs={12} sm={12}>
          <FastField
            name='siteName'
            component={RenderTextField}
            label='* Site name'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name='address'
            component={RenderTextField}
            label='* Site address'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FastField
            name='healthAuthority'
            component={RenderSelectField}
            label='* Health authority'
            disabled={isDisabled}
            options={healthAuthorities}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name='siteContactFirstName'
            component={RenderTextField}
            label='* First name'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name='siteContactLastName'
            component={RenderTextField}
            label='* Last name'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name='emailAddress'
            type='email'
            component={RenderTextField}
            label='* Email address'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name='phoneNumber'
            type='tel'
            component={RenderTextField}
            label='* Phone number'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant='subtitle2'>Site Type and Size</Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name='siteType'
            component={RenderRadioGroup}
            label='* Site type'
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
                name='otherSite'
                component={RenderTextField}
                label='* Please specify'
                disabled={isDisabled}
              />
            </Grid>
          </Fragment>
        )}
        <Grid item xs={12}>
          <Typography variant='subtitle2'>Long-term care beds</Typography>
        </Grid>
        <Grid item xs={12}>
          <FastField
            name='numPublicLongTermCare'
            type='number'
            component={RenderTextField}
            label='* Number of publicly funded beds'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name='numPrivateLongTermCare'
            type='number'
            component={RenderTextField}
            label='* Number of privately funded beds'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant='subtitle2'>Assisted living beds</Typography>
        </Grid>
        <Grid item xs={12}>
          <FastField
            name='numPublicAssistedLiving'
            type='number'
            component={RenderTextField}
            label='* Number of publicly funded beds'
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name='numPrivateAssistedLiving'
            type='number'
            component={RenderTextField}
            label='* Number of privately funded beds'
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </Card>
  );
};
