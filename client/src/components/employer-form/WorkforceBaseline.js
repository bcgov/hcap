import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { BaselineList } from './BaselineList';
import { Box } from '@material-ui/core';

export const WorkforceBaseline = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Site Workforce Baseline
          </Typography>
          <Divider />
        </Grid>

        <Box pt={1} pb={2} pl={2} pr={2}>
          <Typography variant="body1">
            Baseline workforce data is necessary to ensure equitable allocation of Health Care Support Workers (HCSW) and
            HCAP resources across the province.
          </Typography>
        </Box>

        <Grid item xs={12}>
          <FastField
            name="workforceBaseline"
            component={BaselineList}
            label="* Workforce baseline"
            options={[
              { value: 'Registered Nurse', label: 'Registered Nurse' },
              { value: 'Licensed Practical Nurse', label: 'Licensed Practical Nurse' },
              { value: 'Health Care Assistant', label: 'Health Care Assistant' },
              { value: 'Food Services Worker', label: 'Food Services Worker' },
              { value: 'Housekeeping', label: 'Housekeeping' },
              { value: 'COVID-19 IPC Response', label: 'COVID-19 IPC Response' },
              { value: 'Site Administrative Staff', label: 'Site Administrative Staff (please only include site administrative staff that are physically located at your site)' },
            ]}
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </Card>
  );
};
