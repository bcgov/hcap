import React from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField } from '../fields';
import { OrgBookSearch } from './OrgBookSearch';

export const OperatorInfo = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Operator Contact Information
          </Typography>
          <Divider />
        </Grid>

        <Box pt={1} pb={2} pl={2} pr={2}>
          <Typography variant="body1">
            This section collects data on the site operator. Expressions of Interest should be made at the site level but an operator
            with multiple sites may submit more than one EOI which will be consolidated according to the data entered in this
            section.
          </Typography>
        </Box>

        <Grid item xs={12}>
          <FastField
            name="registeredBusinessName"
            component={OrgBookSearch}
            label="* Registered business name"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name="operatorName"
            component={RenderTextField}
            label="* Operator name"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={6}>
          <FastField
            name="operatorContactFirstName"
            component={RenderTextField}
            label="* Operator contact first name"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={6}>
          <FastField
            name="operatorContactLastName"
            component={RenderTextField}
            label="* Operator contact last name"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={6}>
          <FastField
            name="operatorEmail"
            type="email"
            component={RenderTextField}
            label="* Operator contact email"
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={6}>
          <FastField
            name="operatorPhone"
            type="tel"
            component={RenderTextField}
            label="* Operator contact phone number"
            disabled={isDisabled}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
