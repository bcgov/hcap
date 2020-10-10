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

        <Grid item xs={6}>
          <FastField
            name="operatorFirstName"
            component={RenderTextField}
            label="* Operator first name:"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={6}>
          <FastField
            name="operatorLastName"
            component={RenderTextField}
            label="* Operator last name:"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={6}>
          <FastField
            name="operatorContactFirstName"
            component={RenderTextField}
            label="* Operator contact first name:"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={6}>
          <FastField
            name="operatorContactLastName"
            component={RenderTextField}
            label="* Operator contact last name:"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="operatorEmail"
            type="email"
            component={RenderTextField}
            label="* Operator contact email address:"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="operatorPhone"
            type="tel"
            component={RenderTextField}
            label="* Operator contact phone number:"
            disabled={isDisabled}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
