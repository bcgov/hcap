import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import EditIcon from '@material-ui/icons/Edit';

import { Card, Button } from '../generic';
import { OperatorInfo } from './OperatorInfo';
import { SiteInfo } from './SiteInfo';
import { HcapRequest } from './HcapRequest';
import { WorkforceBaseline } from './WorkforceBaseline';
import { CollectionNotice } from './CollectionNotice';
import { StaffingChallenges } from './StaffingChallenges';

export const Review = ({ handleEditClick, isDisabled }) => {

  return (
    <Fragment>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between">
                <Grid item>
                  <Typography variant="subtitle1">
                    1. Operator Contact Information
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(1)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <OperatorInfo isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    2. Site Information
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(2)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <SiteInfo isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    3. Expression of Interest
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(3)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <HcapRequest isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    4. Site Workforce Baseline
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(4)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <WorkforceBaseline isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    5. Comments and Description of Staffing Challenges
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(5)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <StaffingChallenges isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CollectionNotice />
          </Card>
        </Grid>
      </Grid>
    </Fragment>
  );
};
