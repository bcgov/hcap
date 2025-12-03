import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography } from '@mui/material';
import { ParticipantCohortTableFilters } from '../../pages/private/ParticipantCohortTableFilters';
import { Table as GenericTable, Button } from '../generic';
import { TablePagination } from '@mui/material';
import Alert from '@mui/material/Alert';

export const AddParticipantDialog = ({
  open,
  onClose,
  filter,
  setFilter,
  sortedParticipantsToAssign,
  sortConfig,
  handleRequestSort,
  handleAssignParticipant,
  rowsPerPageOptions,
  totalParticipants,
  rowsPerPage,
  currentPage,
  handleChangePage,
  handleChangeRowsPerPage,
  cohort,
}) => {
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
      id: 'emailAddress',
      name: 'Email',
      sortable: true,
    },
    {
      id: 'addButton',
      name: 'Add',
      sortable: false,
    },
  ];

  // Checking if the cohort end date has expired
  const isEndDatePassed = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    return end < today;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='add-participant-dialog-title'
      fullWidth
      maxWidth='md'
    >
      <DialogTitle id='add-participant-dialog-title'> Add Participants to Cohort </DialogTitle>
      <DialogContent>
        <Box>
          <Typography> Select Participants to Add: </Typography>
          <Box>
            {cohort?.availableCohortSeats === 0 && (
              <Alert severity='error'>
                No available seats in the cohort. Cannot add participants.
              </Alert>
            )}
            {isEndDatePassed(cohort?.end_date) && (
              <Alert severity='error'>
                The cohort end date has passed. Cannot add participants.
              </Alert>
            )}
          </Box>
          <ParticipantCohortTableFilters filter={filter} setFilter={setFilter} />
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
                case 'emailAddress':
                  return row?.body?.emailAddress;
                case 'addButton':
                  return (
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={() => handleAssignParticipant(row.id)}
                      text='Add'
                      disabled={
                        cohort?.availableCohortSeats === 0 || isEndDatePassed(cohort?.end_date)
                      }
                    />
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddParticipantDialog;
