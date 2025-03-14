import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import { PSICohortTable } from '../participant-details/psi-cohort-table';
import { sortPSI } from '../../services';
import { useToast } from '../../hooks';

export const TransferParticipantDialog = ({
  open,
  onClose,
  selectedParticipant,
  allCohorts,
  fetchCohortDetails,
}) => {
  const { openToast } = useToast();

  const handleTransfer = async (selectedCohort) => {
    try {
      openToast({
        status: 'success',
        message: `Participant successfully transferred to ${selectedCohort.cohort_name}`,
      });

      fetchCohortDetails(); // Rafraîchir les détails de la cohorte
      onClose();
    } catch (error) {
      openToast({
        status: 'error',
        message: `Failed to transfer participant: ${error.message}`,
      });
    }
  };

  const sortedCohorts = sortPSI({
    psiList: allCohorts,
    cohort: selectedParticipant?.cohort || {},
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>Transfer Participant</DialogTitle>
      <DialogContent>
        {selectedParticipant ? (
          <>
            <Typography variant='h6' gutterBottom>
              Transfer {selectedParticipant.firstName} {selectedParticipant.lastName} to:
            </Typography>

            {sortedCohorts.length > 0 ? (
              <PSICohortTable rows={sortedCohorts} assignAction={handleTransfer} disabled={false} />
            ) : (
              <Typography variant='body1'>Loading available cohorts...</Typography>
            )}
          </>
        ) : (
          <Typography variant='body1'>Loading participant details...</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransferParticipantDialog;
