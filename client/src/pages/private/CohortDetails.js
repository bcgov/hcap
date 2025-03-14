import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Box,
  Card,
  Grid,
  Typography,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';

import {
  BulkGraduationDialog,
  AddParticipantDialog,
  TransferParticipantDialog,
} from '../../components/dialogs';
import { AuthContext } from '../../providers';
import { Page, CheckPermissions, Table, Button } from '../../components/generic';
import { Role, Routes, ToastStatus } from '../../constants';
import { useToast, useCohortData } from '../../hooks';
import {
  createPostHireStatus,
  getPostHireStatusLabel,
  removeCohortParticipantPSI,
  fetchParticipant,
  getPsi,
  assignParticipantWithCohort,
} from '../../services';
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
  const {
    cohort,
    rows,
    isLoading,
    participantsToAssign,
    totalParticipants,
    currentPage,
    rowsPerPage,
    filter,
    setFilter,
    setCurrentPage,
    setRowsPerPage,
    setIsLoading,
    fetchCohortDetails,
    fetchDataAddParticipantModal,
  } = useCohortData(cohortId);
  const classes = useStyles();
  const history = useHistory();
  const { openToast } = useToast();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const isHA = roles?.includes(Role.HealthAuthority) || false;

  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [allCohorts, setAllCohorts] = useState([]); // Current page number // Number of rows per page
  const rowsPerPageOptions = [5, 10, 25];
  const prevFilter = useRef({ lastName: '', emailAddress: '' });

  // eslint-disable-next-line no-unused-vars
  const [disableAssign, setDisableAssign] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });

  const columns = [
    { id: 'lastName', name: 'Last Name', sortable: false },
    { id: 'firstName', name: 'First Name', sortable: false },
    { id: 'siteName', name: 'Site Name', sortable: false },
    { id: 'graduationStatus', name: 'Graduation Status', sortable: false },
    { id: 'removeButton', name: 'Action', sortable: false },
    { id: 'transferButton', name: 'Transfer', sortable: false },
  ];

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

  const closeAddParticipantModal = () => {
    setActiveModalForm(null);
  };

  const handleTransferParticipant = (participantId) => {
    setTransferModalOpen(true);
    fetchTransferData(participantId);
  };

  const fetchTransferData = useCallback(
    async (participantId) => {
      try {
        setIsLoading(true);
        // Fetch participant details
        const participant = await fetchParticipant({ id: participantId });
        setSelectedParticipant(participant);

        if (
          participant.interested?.toLowerCase() === 'withdrawn' ||
          participant.interested?.toLowerCase() === 'no'
        ) {
          setDisableAssign(true);
          return;
        }

        try {
          const list = await getPsi();
          console.log('PSI retrieved:', list);
          setAllCohorts(list);
        } catch (error) {
          console.error('Error while trying to retrieve PSI:', error);
        }
      } catch (error) {
        console.error('Error fetching transfer data:', error);
        openToast({
          status: ToastStatus.Error,
          message: 'Failed to fetch participant details or cohorts',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [openToast, setIsLoading]
  );

  const handleOpenParticipantDetails = (participantId) => {
    const participantDetailsPath = keyedString(Routes.ParticipantDetails, {
      id: participantId,
      page: 'cohort-details',
      pageId: cohortId,
    });
    history.push(participantDetailsPath);
  };

  const handleRemoveParticipant = async (participantId) => {
    setParticipantToRemove(participantId);
    setOpenConfirmDialog(true);
  };

  const confirmRemoveParticipant = async () => {
    try {
      await removeCohortParticipantPSI(cohortId, participantToRemove);
      openToast({
        status: ToastStatus.Success,
        message: 'Participant removed from cohort successfully',
      });
      fetchCohortDetails();
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: error.message || 'Failed to remove participant from cohort',
      });
    } finally {
      setOpenConfirmDialog(false);
      setParticipantToRemove(null);
    }
  };

  const handleAddParticipantClick = async () => {
    setActiveModalForm('add-participant');
  };

  const handleAssignParticipant = async (participantId) => {
    try {
      await assignParticipantWithCohort({ participantId: participantId, cohortId: cohortId }); // Use the service to assign
      openToast({
        status: ToastStatus.Success,
        message: `Participant ${participantId} assigned to cohort ${cohortId} successfully`,
      });
      fetchDataAddParticipantModal();
      fetchCohortDetails();
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: `Failed to assign participant ${participantId} to cohort ${cohortId}: ${error}`,
      });
    }
  };

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0); // Reset to the first page when changing rows per page
  };

  const handleRequestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({
      key,
      direction,
    });
  };

  const sortedParticipantsToAssign = useMemo(() => {
    // Ensure participantsToAssign is an array before attempting to sort
    if (!Array.isArray(participantsToAssign)) {
      return [];
    }
    let sortableItems = [...participantsToAssign];

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [participantsToAssign, sortConfig]);

  const resetPage = () => {
    setCurrentPage(0);
  };

  useEffect(() => {
    if (activeModalForm === 'add-participant') {
      if (
        filter.lastName !== prevFilter.current.lastName ||
        filter.emailAddress !== prevFilter.current.emailAddress
      ) {
        resetPage();
      }
      fetchDataAddParticipantModal();
      prevFilter.current = { ...filter };
    }
  }, [currentPage, rowsPerPage, filter, activeModalForm]);

  const cohortEndDate = formatCohortDate(cohort?.end_date, { isForm: true });
  const hasSelectedParticipantGraduated = selectedParticipants
    .map(({ id, postHireJoin }) => ({ id, graduated: postHireJoin.length !== 0 }))
    .filter(({ graduated }) => graduated);

  return (
    <Page>
      {showGraduationModal && (
        <BulkGraduationDialog
          open={showGraduationModal}
          onClose={() => setShowGraduationModal(false)}
          cohortEndDate={cohortEndDate}
          onSubmit={handleBulkGraduate}
          participantIds={selectedParticipants.map(({ id }) => id)}
        />
      )}

      {activeModalForm === 'add-participant' && (
        <AddParticipantDialog
          open={true}
          onClose={closeAddParticipantModal}
          filter={filter}
          setFilter={setFilter}
          sortedParticipantsToAssign={sortedParticipantsToAssign}
          sortConfig={sortConfig}
          handleRequestSort={handleRequestSort}
          handleAssignParticipant={handleAssignParticipant}
          rowsPerPageOptions={rowsPerPageOptions}
          totalParticipants={totalParticipants}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          cohort={cohort}
        />
      )}

      {transferModalOpen && (
        <TransferParticipantDialog
          open={true}
          onClose={() => setTransferModalOpen(false)}
          selectedParticipant={selectedParticipant}
          allCohorts={allCohorts}
        />
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

            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <CheckPermissions permittedRoles={[Role.MinistryOfHealth]}>
                  <Box>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleAddParticipantClick}
                      text={'Add Participant'}
                      disabled={cohort?.availableCohortSeats === 0}
                    >
                      Add Participant
                    </Button>
                  </Box>
                </CheckPermissions>
              </Grid>

              <Grid item xs={12} sm={6}>
                <CheckPermissions permittedRoles={[Role.MinistryOfHealth]}>
                  <Box>
                    {cohort?.availableCohortSeats === 0 && (
                      <Alert severity='error'>
                        No available seats in the cohort. Cannot add participants.
                      </Alert>
                    )}
                  </Box>
                </CheckPermissions>
              </Grid>
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
              {isLoading ? (
                <Typography variant='subtitle1' className={classes.notFoundBox}>
                  Loading Participants...
                </Typography>
              ) : rows.length > 0 ? (
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
                      case 'removeButton':
                        return (
                          <Button
                            size='small'
                            variant='outlined'
                            color='secondary'
                            onClick={() => handleRemoveParticipant(row.id)}
                            text='Remove'
                          />
                        );
                      case 'transferButton':
                        return (
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => handleTransferParticipant(row.id)}
                            text='Transfer'
                          />
                        );
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
        <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
          <DialogTitle>Confirm Removal</DialogTitle>
          <DialogContent>
            Are you sure you want to remove this participant from the cohort?
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenConfirmDialog(false)}
              variant='outlined'
              text='Cancel'
              color='primary'
            />
            <Button
              onClick={confirmRemoveParticipant}
              variant='outlined'
              text='Confirm'
              color='secondary'
            />
          </DialogActions>
        </Dialog>
      </CheckPermissions>
    </Page>
  );
};
