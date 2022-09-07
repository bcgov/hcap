import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Box, Card, Grid, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Page, CheckPermissions } from '../../components/generic';
import { useToast } from '../../hooks';
import { fetchCohort, fetchParticipantPostHireStatus } from '../../services';
import { Routes, ToastStatus, postHireStatuses } from '../../constants';

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
  const [unsuccessfulParticipantsNumber, setUnsuccessfulParticipantsNumber] = useState(-1);
  const { openToast } = useToast();

  const getTotalParticipantsNumber = () => {
    return cohort ? cohort.cohort_size : 0;
  };

  const getAvailableParticipantsNumber = () => {
    if (!cohort) return 0;
    const totalNumber = cohort.cohort_size;
    const assignedParticipantsNumber = cohort.participants?.length;
    return totalNumber - assignedParticipantsNumber;
  };

  const fetchUnsuccessfulParticipantsNumber = async () => {
    if (!cohort) return;

    const cohortParticipantIds = cohort.participants.map(
      (participant) => participant.participant_id
    );
    let participantCount = 0;
    for (const participantId of cohortParticipantIds) {
      const postHireData = await fetchParticipantPostHireStatus({ id: participantId });
      const status = postHireData?.status;
      if (status === postHireStatuses.cohortUnsuccessful) participantCount++;
    }
    setUnsuccessfulParticipantsNumber(participantCount);
  };

  const fetchCohortDetails = async () => {
    try {
      const data = await fetchCohort({ cohortId });
      setCohort(data);
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
    if (unsuccessfulParticipantsNumber === -1) {
      fetchUnsuccessfulParticipantsNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohort, unsuccessfulParticipantsNumber]);

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
                <Typography variant='body1'>{getTotalParticipantsNumber()}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2'>Total Available Seats</Typography>
                <Typography variant='body1'>{getAvailableParticipantsNumber()}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2'>Number of Unsuccessful Participants</Typography>
                <Typography variant='body1'>{unsuccessfulParticipantsNumber}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Card>
      </CheckPermissions>
    </Page>
  );
};
