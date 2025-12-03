import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Typography } from '@mui/material';
import { PSICohortTable } from '../participant-details/psi-cohort-table';
import { sortPSI, transferParticipantToNewCohort } from '../../services';
import { useToast } from '../../hooks';

export const TransferParticipantDialog = ({
  open,
  onClose,
  selectedParticipant,
  allCohorts,
  fetchCohortDetails,
}) => {
  const { openToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sortedCohorts, setSortedCohorts] = useState([]);

  useEffect(() => {
    if (selectedParticipant && allCohorts.length > 0) {
      const sorted = sortPSI({
        psiList: allCohorts,
        cohort: selectedParticipant.cohort || {},
      });
      setSortedCohorts(sorted);
      setIsLoading(false);
    }
  }, [selectedParticipant, allCohorts]);

  const handleTransfer = async (selectedCohort) => {
    try {
      await transferParticipantToNewCohort({
        participantId: selectedParticipant.id,
        cohortId: selectedParticipant.cohort.id,
        newCohortId: selectedCohort.id,
      });

      openToast({
        status: 'success',
        message: `Participant successfully transferred to ${selectedCohort.cohort_name}`,
      });

      fetchCohortDetails();
      onClose();
    } catch (error) {
      openToast({
        status: 'error',
        message: `Failed to transfer participant: ${error.message}`,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>Transfer Participant</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Typography variant='body1'>
            Loading participant details and available cohorts...
          </Typography>
        ) : (
          <>
            <Typography variant='h6' gutterBottom>
              Transfer {selectedParticipant.firstName} {selectedParticipant.lastName} to:
            </Typography>

            {sortedCohorts.length > 0 ? (
              <PSICohortTable rows={sortedCohorts} assignAction={handleTransfer} disabled={false} />
            ) : (
              <Typography variant='body1'>No available cohorts found.</Typography>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransferParticipantDialog;
