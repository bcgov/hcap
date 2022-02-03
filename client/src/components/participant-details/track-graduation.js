import { Grid, Typography } from '@material-ui/core';
import { Button } from '../../components/generic/Button';
import React from 'react';
import moment from 'moment';
export const TrackGraduation = (props) => {
  const cohort = props?.participant?.cohort;
  return (
    <>
      <Grid container>
        <Grid item xs={4}>
          <Typography>Cohort start date</Typography>
          <Typography>{moment(cohort?.start_date).format('DD MMM YYYY')}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Cohort end date</Typography>
          <Typography>{moment(cohort?.end_date).format('DD MMM YYYY')}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Graduation status</Typography>
          <Typography>{'TO BE ADDED'}</Typography>
          <Grid item xs={6}>
            <Button color='default' variant='contained' text='Update status' />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
