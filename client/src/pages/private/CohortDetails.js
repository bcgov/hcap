import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import TablePagination from '@material-ui/core/TablePagination';

import { ManageGraduationForm } from '../../components/modal-forms/ManageGraduationForm';
import { AuthContext } from '../../providers';
import {
  Page,
  CheckPermissions,
  Table,
  Button,
  Table as GenericTable,
} from '../../components/generic';
import { Role, Routes, ToastStatus, postHireStatuses } from '../../constants';
import { useToast } from '../../hooks';
import {
  createPostHireStatus,
  fetchCohort,
  getPostHireStatusLabel,
  removeCohortParticipantPSI,
  fetchParticipantsToAssign,
  fetchParticipant,
  getPsi,
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
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState(null);
  const [participantsToAssign, setParticipantsToAssign] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [allCohorts, setAllCohorts] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // Current page number
  const [rowsPerPage, setRowsPerPage] = useState(5); // Number of rows per page
  const rowsPerPageOptions = [5, 10, 25];

  // eslint-disable-next-line no-unused-vars
  const [disableAssign, setDisableAssign] = useState(false);

  const addParticipantColumns = [
    {
      id: 'firstName',
      name: 'First Name',
      sortable: true,
    },
    {
      id: 'lastName',
      name: 'Last Name',
      sortable: true,
    },
    {
      id: 'addButton',
      name: 'Add',
      sortable: false,
    },
  ];

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

  const fetchCohortDetails = useCallback(async () => {
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
  }, [cohortId, openToast]);

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

  const closeModal = () => {
    setCohort(null);
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
        const participant = await fetchParticipant(participantId);
        setSelectedParticipant(participant);

        if (
          participant.interested?.toLowerCase() === 'withdrawn' ||
          participant.interested?.toLowerCase() === 'no'
        ) {
          setDisableAssign(true);
          return;
        }

        getPsi().then((list) => {
          setAllCohorts(list);
        });
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
    [openToast]
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
    try {
      // Calculate offset based on current page and rows per page
      const offset = currentPage * rowsPerPage;
      const response = await fetchParticipantsToAssign(rowsPerPage, offset);
      const participants = response.participants;
      const total = response.total;
      setParticipantsToAssign(participants);
      setTotalParticipants(total);
    } catch (error) {
      openToast({ status: ToastStatus.Error, message: 'Failed to fetch participants to assign' });
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

  useEffect(() => {
    console.log('participantsToAssign has changed:', participantsToAssign);
  }, [participantsToAssign]);

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
      console.log('Exit');
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

  useEffect(() => {
    fetchCohortDetails();
  }, []);

  useEffect(() => {
    if (activeModalForm === 'add-participant') {
      handleAddParticipantClick();
    }
  }, [currentPage, rowsPerPage, activeModalForm]);

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

      <Dialog
        open={activeModalForm === 'add-participant'}
        onClose={closeModal}
        aria-labelledby='add-participant-dialog-title'
        fullWidth
        maxWidth='md'
      >
        <DialogTitle id='add-participant-dialog-title'> Add Participants to Cohort </DialogTitle>{' '}
        <DialogContent>
          <Box>
            <Typography> Select Participants to Add: </Typography>{' '}
            <GenericTable
              columns={addParticipantColumns}
              rows={sortedParticipantsToAssign}
              order={sortConfig.direction}
              orderBy={sortConfig.key}
              onRequestSort={handleRequestSort}
              renderCell={(columnId, row) => {
                switch (columnId) {
                  case 'firstName':
                    return row?.body?.firstName;
                  case 'lastName':
                    return row?.body?.lastName;
                  case 'addButton':
                    return (
                      <Button variant='contained' color='primary' onClick={() => {}}>
                        Add
                      </Button>
                    );
                  default:
                    return null;
                }
              }}
            />
            <TablePagination
              rowsPerPageOptions={rowsPerPageOptions}
              component='div'
              count={parseInt(totalParticipants, 10)}
              rowsPerPage={rowsPerPage}
              page={currentPage}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
            />
          </Box>{' '}
        </DialogContent>{' '}
      </Dialog>

      <Dialog open={transferModalOpen} onClose={() => setTransferModalOpen(false)}>
        <DialogTitle> Transfer Participant </DialogTitle>{' '}
        <DialogContent>
          {' '}
          {selectedParticipant ? (
            <>
              <Typography>
                Transfer: {selectedParticipant.firstName} {selectedParticipant.lastName}{' '}
              </Typography>{' '}
              {allCohorts.length > 0 ? (
                <List>
                  {' '}
                  {allCohorts.map((cohort) => (
                    <ListItem button key={cohort.id}>
                      <ListItemText primary={cohort.cohort_name} />{' '}
                    </ListItem>
                  ))}{' '}
                </List>
              ) : (
                <Typography> Loading cohorts... </Typography>
              )}{' '}
            </>
          ) : (
            <Typography> Loading participant details... </Typography>
          )}{' '}
        </DialogContent>{' '}
        <DialogActions>
          <Button onClick={() => setTransferModalOpen(false)} color='primary'>
            Cancel{' '}
          </Button>{' '}
          <Button onClick={() => {}} color='primary'>
            Transfer{' '}
          </Button>{' '}
        </DialogActions>{' '}
      </Dialog>

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

            <Grid item xs={12} sm={3}>
              <CheckPermissions permittedRoles={[Role.MinistryOfHealth]}>
                <Box>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleAddParticipantClick}
                    text={'Add Participant'}
                  >
                    Add Participant
                  </Button>
                </Box>
              </CheckPermissions>
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
