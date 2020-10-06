import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField, RenderSelectField } from '../fields';

export const BusinessDetailsFields = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Business Details
          </Typography>
          <Divider />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="businessKind"
            component={RenderTextField}
            label="* What kind of business do you run?"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="workersSize"
            type="number"
            component={RenderTextField}
            label="* How many people do you need?"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography>
            * Are you:
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="employerType"
            component={RenderSelectField}
            disabled={isDisabled}
            options={[
              { value: 'private', label: 'Private' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'health_authority', label: 'Health Authority' },
            ]}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
