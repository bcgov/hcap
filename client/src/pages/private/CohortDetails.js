import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Box, Card, Grid, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Page, CheckPermissions } from '../../components/generic';
import { useToast } from '../../hooks';
import { fetchCohort } from '../../services';
import { Routes, ToastStatus } from '../../constants';

const useStyles = makeStyles((theme) => ({
  cardRoot: {
    minWidth: '1020px',
  },
  gridRoot: {
    padding: theme.spacing(2),
  },
}));

export default ({ match }) => {
  const cohortId = parseInt(match.params.id);
  const classes = useStyles();
  const [cohort, setCohort] = useState(null);
  const { openToast } = useToast();

  const fetchCohortDetails = async () => {
    try {
      const data = await fetchCohort({ cohortId });
      setCohort(data);
      console.log(data);
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'Failed to fetch cohort',
      });
    }
  };

  useEffect(() => {
    if (cohort === null) {
      fetchCohortDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohort]);

  return (
    <Page>
      <CheckPermissions
        permittedRoles={['health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Card className={classes.cardRoot}>
          <Box py={8} px={10}>
            <Typography variant='body1'>
              <Link href={Routes.PSIView}>Manage PSI</Link> / Cohort Details
            </Typography>

            <Box py={2}>
              <Typography variant='h2'>{cohort?.cohort_name}</Typography>
            </Box>

            <Grid container spacing={2} className={classes.gridRoot}>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2'>Start Date</Typography>
                <Typography variant='body1'>
                  {dayjs(cohort?.start_date).format('MMM DD, YYYY')}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2'>End Date</Typography>
                <Typography variant='body1'>
                  {dayjs(cohort?.end_date).format('MMM DD, YYYY')}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2'>Total Seats</Typography>
                <Typography variant='body1'>{cohort?.cohort_size}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2'>Total Available Seats</Typography>
                <Typography variant='body1'>
                  {cohort?.cohort_size - cohort?.participants.length}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Card>
      </CheckPermissions>
    </Page>
  );
};
