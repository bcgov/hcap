import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderTextField } from '../fields';
import { Box } from '@material-ui/core';

export const HcapRequest = ({ isDisabled }) => {

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Typography variant="subtitle2">
            HCAP Request
          </Typography>
          <Divider />
        </Grid>

        <Box pt={1} pb={2} pl={2} pr={2}>
          <Typography variant="body1">
            The notional allocation of full-time equivalents (FTEs) was based on a model of site size and type. Long-term care sites
            will receive a higher notional allocation as these sites hire more health care assistants than assisted living sites (and
            therefore will have more employment opportunities for HCAP participants upon program completion).
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" gutterBottom>
                Small Sites (&lt;50 units). Notional allocations: AL = 1 FTE | LTC = 2 FTEs.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                Medium Sites (50-100 units): Notional allocations: AL = 2 FTE | LTC = 4.5 FTEs.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                Large Sites (&gt;100 units): Notional allocations: AL 4 FTE | LTC 7 FTEs.
              </Typography>
            </li>
          </ul>
          <Typography variant="body1">
            Notional FTE distributions are subject to change based on vacancy rates by geographic area and/or campus of care
            models. Health Authorities will determine the allocation of FTEs across each region and sub-region, considering the
            following: fair allocation of resources, full distribution of available FTEs, vacancy rates, and other factors.
            <br /><br />
            There will be a second phase of allocation at the beginning of Fiscal Year 2021/22.
          </Typography>
        </Box>

        <Grid item xs={12}>
          <FastField
            name="hcswFteNumber"
            type="number"
            component={RenderTextField}
            label="* Number of HCSW FTEs your site could support"
            disabled={isDisabled}
          />
        </Grid>

      </Grid>
    </Card>
  );
};
