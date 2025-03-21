import React, { useEffect, useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import { Box, Card, Grid, Typography, Link, Dialog } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';

import { ManageGraduationForm } from '../../components/modal-forms/ManageGraduationForm';
import { AuthContext } from '../../providers';
import { Page, CheckPermissions, Table, Button } from '../../components/generic';
import { Role, Routes, ToastStatus, postHireStatuses } from '../../constants';
import { useToast } from '../../hooks';
import { createPostHireStatus, fetchCohort, getPostHireStatusLabel } from '../../services';
import { keyedString, formatCohortDate } from '../../utils';

const useStyles = makeStyles((theme) => ({
  cardRoot: {
    width: '1020px',
  },
  gridRoot: {
    padding: theme.spacing(2),
  },
  notFoundBox: {
    textAlign: 'center',
    paddingTop: theme.spacing(3),
  },
}));

export default ({ match }) => {
  const cohortId = parseInt(match.params.id);
  const classes = useStyles();
  const history = useHistory();
  const { openToast } = useToast();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const isHA = roles?.includes(Role.HealthAuthority) || false;

  const [cohort, setCohort] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [rows, setRows] = useState([]);
  const [showGraduationModal, setShowGraduationModal] = useState(false);

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

  // Bulk Graduation only allows the successful graduation path
  const handleBulkGraduate = async (values) => {
    const payload = {
      ...values,
      data: {
        graduationDate: values?.data?.date,
      },
    };
    await createPostHireStatus(payload);
    openToast({
      status: ToastStatus.Success,
      message: 'Participant(s) status updated',
    });
    setShowGraduationModal(false);
    setSelectedParticipants([]);
    fetchCohortDetails();
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

  const cohortEndDate = formatCohortDate(cohort?.end_date, { isForm: true });
  const hasSelectedParticipantGraduated = selectedParticipants
    .map(({ id, postHireJoin }) => ({ id, graduated: postHireJoin.length !== 0 }))
    .filter(({ graduated }) => graduated);

  return (
    <Page>
      {showGraduationModal && (
        <Dialog title={'Set Bulk Graduation Status'} open={showGraduationModal}>
          <ManageGraduationForm
            cohortEndDate={cohortEndDate}
            initialValues={{
              status: postHireStatuses.postSecondaryEducationCompleted,
              data: {
                date: cohortEndDate,
              },
              continue: 'continue_yes',
              participantIds: selectedParticipants.map(({ id }) => id),
            }}
            onClose={() => {
              setShowGraduationModal(false);
            }}
            onSubmit={handleBulkGraduate}
            isBulkGraduate
          />
        </Dialog>
      )}

      <CheckPermissions
        permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}
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
                      Participants hired outside your region will not appear in this list
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>

            <CheckPermissions permittedRoles={[Role.HealthAuthority]}>
              <>
                <Grid item xs={2}>
                  <Button
                    size='small'
                    variant='outlined'
                    text='Bulk Graduate'
                    disabled={
                      selectedParticipants.length < 1 || hasSelectedParticipantGraduated.length > 0
                    }
                    onClick={() => {
                      setShowGraduationModal(true);
                    }}
                  />
                </Grid>
                <br />
                {hasSelectedParticipantGraduated.length > 0 && (
                  <Alert severity='warning'>
                    Bulk Graduation is only available for participants with no graduation status.
                    Please deselect participants who have had a successful or unsuccessful
                    graduation.
                  </Alert>
                )}
              </>
            </CheckPermissions>

            <Box>
              {rows.length > 0 ? (
                <Table
                  columns={columns}
                  rows={rows}
                  isLoading={isLoading}
                  isMultiSelect={roles.includes(Role.HealthAuthority)}
                  selectedRows={selectedParticipants}
                  updateSelectedRows={setSelectedParticipants}
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
