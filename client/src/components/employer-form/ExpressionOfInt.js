import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField } from '../fields';
import { Box } from '@mui/material';

export const ExpressionOfInt = ({ isDisabled }) => {
  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant='subtitle2'>Expression of Interest</Typography>
          <Divider />
        </Grid>

        <Box pt={1} pb={2} pl={2} pr={2}>
          <Typography variant='body1'>
            Sites will be eligible for resources based on demonstrated need, capacity for oversight
            of Health Care Support Workers, and the number of public long-term care and assisted
            living beds at each site.
          </Typography>
        </Box>

        <Grid item xs={12}>
          <FastField
            name='hcswFteNumber'
            type='number'
            component={RenderTextField}
            label='* Approximately how many Health Care Support Workers (Non-Clinical/Non-Direct Care Roles) could this site support?'
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FastField
            name='staffingChallenges'
            component={RenderTextField}
            label='Please use this space to explain any staffing challenges you may be facing at this site and to provide any additional information relevant to your expression of interest'
            multiline
            rows={5}
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </Card>
  );
};
