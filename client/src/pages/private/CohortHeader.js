import React from 'react';
import { Box, Grid, Typography, Link } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import dayjs from 'dayjs';
import { Routes, ALERT_MESSAGES } from '../../constants';
/**
 *
 * @param {*} param0
 * @returns
 */
const CohortHeader = ({ cohort, isHA }) => {
  return (
    <>
      <Typography variant='body1'>
        <Link href={Routes.PSIView}>PSI</Link> / Cohorts / {cohort?.cohort_name}
      </Typography>

      <Box py={2}>
        <Typography variant='h2'>{cohort?.cohort_name}</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant='subtitle2'>Start Date</Typography>
          <Typography variant='body1'>
            {dayjs.utc(cohort?.start_date).format('MMM DD, YYYY')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant='subtitle2'>End Date</Typography>
          <Typography variant='body1'>
            {dayjs.utc(cohort?.end_date).format('MMM DD, YYYY')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant='subtitle2'>Total Seats</Typography>
          <Typography variant='body1'>{cohort?.cohort_size ?? '...'}</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant='subtitle2'>Total Available Seats</Typography>
          <Typography variant='body1'>{cohort?.availableCohortSeats ?? '...'}</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant='subtitle2'>Number of Unsuccessful Participants</Typography>
          <Typography variant='body1'>{cohort?.unsuccessfulParticipants ?? '...'}</Typography>
        </Grid>

        {isHA && (
          <Grid item xs={12}>
            <Alert severity='info'>
              <Typography variant='body2' gutterBottom>
                {ALERT_MESSAGES.HIRED_OUTSIDE}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default CohortHeader;
