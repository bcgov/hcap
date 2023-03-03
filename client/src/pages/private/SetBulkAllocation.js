import React, { useState, useEffect } from 'react';
import { Button } from '../../components/generic';
import { Box } from '@material-ui/core';
import { fetchPhases } from '../../services/phases';

import { BulkAllocationForm } from '../../components/modal-forms/BulkAllocationForm';

export const SetBulkAllocation = ({ sites, handleFormSubmit }) => {
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [phases, setPhases] = useState(null);
  const [isPendingRequests, setIsPendingRequests] = useState(true);

  const closeDialog = () => {
    setActiveModalForm(null);
  };

  const handleAfterSave = async () => {
    await handleFormSubmit();
    fetchData();
    closeDialog();
  };

  const openBulkAllocationModal = () => {
    setActiveModalForm('bulk-allocation');
  };

  const fetchData = async () => {
    let phases = await fetchPhases('?includeAllocations=true');
    setPhases(phases);
    setIsPendingRequests(false);
  };

  useEffect(() => {
    if (isPendingRequests) {
      fetchData();
    }
  }, [isPendingRequests, fetchData]);

  return (
    <>
      <BulkAllocationForm
        open={activeModalForm === 'bulk-allocation'}
        onClose={closeDialog}
        afterSubmit={handleAfterSave}
        sites={sites}
        phases={phases}
      />
      <Box>
        <Button
          onClick={openBulkAllocationModal}
          text='Set Allocation'
          variant='outlined'
          fullWidth={false}
          disabled={sites.length === 0}
        />
      </Box>
    </>
  );
};
