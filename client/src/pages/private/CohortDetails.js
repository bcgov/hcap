import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import { Box, Card, Grid, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Page, CheckPermissions, Table } from '../../components/generic';
import { Routes, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';
import { fetchCohort, getPostHireStatusLabel } from '../../services';
import { keyedString } from '../../utils';

const useStyles = makeStyles((theme) => ({
  cardRoot: {
    minWidth: '1020px',
  },
  gridRoot: {
    padding: theme.spacing(2),
  },
  notFoundBox: {
    textAlign: 'center',
    paddingTop: theme.spacing(6),
  },
}));

export default ({ match }) => {
  const cohortId = parseInt(match.params.id);
  const classes = useStyles();
  const history = useHistory();
  const { openToast } = useToast();

  const [cohort, setCohort] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const columns = [
    { id: 'lastName', name: 'Last Name', sortable: false },
    { id: 'firstName', name: 'First Name', sortable: false },
    { id: 'siteName', name: 'Site Name', sortable: false },
    { id: 'graduationStatus', name: 'Graduation Status', sortable: false },
  ];

  const fetchCohortDetails = async () => {
    try {
      setIsLoading(true);
      const cohortData = await fetchCohort({ cohortId });
      setCohort(cohortData.cohort);
      setRows(cohortData.participants);
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'Failed to fetch cohort details',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getParticipantGraduationStatus = (participantStatuses) => {
    if (!participantStatuses || participantStatuses.length === 0) return 'Not recorded';
    const graduationStatus = participantStatuses.find(
      (postHireStatus) => postHireStatus.is_current === true
    );
    return getPostHireStatusLabel(graduationStatus);
  };

  const handleOpenParticipantDetails = (participantId) => {
    const participantDetailsPath = keyedString(Routes.ParticipantDetails, {
      id: participantId,
      page: 'cohort-details',
      pageId: cohortId,
    });
    history.push(participantDetailsPath);
  };

  useEffect(() => {
    fetchCohortDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page>
      <CheckPermissions
        permittedRoles={['health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Card className={classes.cardRoot}>
          <Box py={8} px={10}>
            <Typography variant='body1'>
              <Link href={Routes.PSIView}>PSI</Link> / Cohorts / {cohort?.cohort_name}
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
            </Grid>

            <Box>
              {rows.length > 0 ? (
                <Table
                  columns={columns}
                  rows={rows}
                  isLoading={isLoading}
                  renderCell={(columnId, row) => {
                    switch (columnId) {
                      case 'firstName':
                        return row.body[columnId];
                      case 'lastName':
                        return (
                          <Link
                            component='button'
                            variant='body2'
                            onClick={() => handleOpenParticipantDetails(row.id)}
                          >
                            {row.body[columnId]}
                          </Link>
                        );
                      case 'siteName':
                        return row.siteJoin?.body[columnId];
                      case 'graduationStatus':
                        return getParticipantGraduationStatus(row.postHireJoin);
                      default:
                        return row[columnId];
                    }
                  }}
                />
              ) : (
                <Typography variant='subtitle1' className={classes.notFoundBox}>
                  No Participants in this Cohort
                </Typography>
              )}
            </Box>
          </Box>
        </Card>
      </CheckPermissions>
    </Page>
  );
};
