import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
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
import { Page, CheckPermissions, Button } from '../../components/generic';
import CohortParticipantsTable from '../../components/tables/CohortParticipantsTable';
import CohortHeader from './CohortHeader';
import { createPostHireStatus, assignParticipantWithCohort } from '../../services';

import {
  Role,
  ToastStatus,
  ROWS_PER_PAGE_OPTIONS,
  COLUMNS,
  DIALOG_TITLES,
  ALERT_MESSAGES,
  BUTTON_TEXTS,
} from '../../constants';
import { useToast, useCohortData, useCohortActions, useCohortParticipantsTable } from '../../hooks';
import { formatCohortDate } from '../../utils';

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
    handleOpenParticipantDetails,
    handleTransferParticipant,
    selectedParticipant,
    allCohorts,
    transferModalOpen,
    setTransferModalOpen,
  } = useCohortActions(cohortId);

  const {
    openConfirmDialog,
    setOpenConfirmDialog,
    confirmRemoveParticipant,
    handleRemoveParticipant,
    cohort,
    rows,
    isLoading,
    participantsToAssign,
    totalParticipants,
    currentPage,
    rowsPerPage,
    filter,
    setFilter,
    handleChangePage,
    handleChangeRowsPerPage,
    fetchCohortDetails,
    fetchDataAddParticipantModal,
    setCurrentPage,
  } = useCohortData(cohortId);

  const { selectedParticipants, setSelectedParticipants, sortConfig, handleRequestSort } =
    useCohortParticipantsTable(rows);

  const classes = useStyles();
  const { openToast } = useToast();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const isHA = roles?.includes(Role.HealthAuthority) || false;

  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS;
  const prevFilter = useRef({ lastName: '', emailAddress: '' });

  const columns = COLUMNS;

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

  const handleAddParticipantClick = async () => {
    setActiveModalForm('add-participant');
  };

  const closeAddParticipantModal = () => {
    setActiveModalForm(null);
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
          fetchCohortDetails={fetchCohortDetails}
        />
      )}

      <CheckPermissions
        permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}
        renderErrorMessage={true}
      >
        <Card className={classes.cardRoot}>
          <Box py={8} px={10}>
            <CohortHeader cohort={cohort} isHA={isHA} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <CheckPermissions permittedRoles={[Role.MinistryOfHealth]}>
                  <Box>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleAddParticipantClick}
                      text={BUTTON_TEXTS.ADD_PARTICIPANT}
                      disabled={cohort?.availableCohortSeats === 0}
                    >
                      {DIALOG_TITLES.ADD_PARTICIPANT}
                    </Button>
                  </Box>
                </CheckPermissions>
              </Grid>

              <Grid item xs={12} sm={6}>
                <CheckPermissions permittedRoles={[Role.MinistryOfHealth]}>
                  <Box>
                    {cohort?.availableCohortSeats === 0 && (
                      <Alert severity='error'>{ALERT_MESSAGES.NO_SEATS}</Alert>
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
                    text={BUTTON_TEXTS.BULK_GRADUATE}
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
                  <Alert severity='warning'>{ALERT_MESSAGES.BULK_GRADUATION}</Alert>
                )}
              </>
            </CheckPermissions>

            <Box>
              {isLoading ? (
                <Typography variant='subtitle1' className={classes.notFoundBox}>
                  Loading Participants...
                </Typography>
              ) : rows.length > 0 ? (
                <CohortParticipantsTable
                  columns={columns}
                  rows={rows}
                  isLoading={isLoading}
                  selectedParticipants={selectedParticipants}
                  setSelectedParticipants={setSelectedParticipants}
                  handleOpenParticipantDetails={handleOpenParticipantDetails}
                  handleRemoveParticipant={handleRemoveParticipant}
                  handleTransferParticipant={handleTransferParticipant}
                  roles={roles}
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
          <DialogTitle>{DIALOG_TITLES.CONFIRM_REMOVAL}</DialogTitle>
          <DialogContent>
            Are you sure you want to remove this participant from the cohort?
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenConfirmDialog(false)}
              variant='outlined'
              text={BUTTON_TEXTS.CANCEL}
              color='primary'
            />
            <Button
              onClick={confirmRemoveParticipant}
              variant='outlined'
              text={BUTTON_TEXTS.CONFIRM}
              color='secondary'
            />
          </DialogActions>
        </Dialog>
      </CheckPermissions>
    </Page>
  );
};
