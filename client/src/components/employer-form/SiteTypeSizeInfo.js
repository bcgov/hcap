import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField, useFormikContext } from 'formik';

import { Card, Divider } from '../generic';
import { RenderRadioGroup, RenderTextField } from '../fields';

export const SiteTypeSizeInfo = ({ isDisabled }) => {
  const { values } = useFormikContext();

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Site Type and Size
          </Typography>
          <Divider />
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
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Long-term care beds
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPublicLongTermCare"
            type="number"
            component={RenderTextField}
            label="* Number of publicly funded beds"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPrivateLongTermCare"
            type="number"
            component={RenderTextField}
            label="* Number of privately funded beds"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Assisted living beds
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPublicAssistedLiving"
            type="number"
            component={RenderTextField}
            label="* Number of publicly funded beds"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="numPrivateAssistedLiving"
            type="number"
            component={RenderTextField}
            label="* Number of privately funded beds"
            disabled={isDisabled}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
