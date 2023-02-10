/* eslint-disable */
import React, { useState } from 'react';
import { Button } from '../../components/generic';
import { Box } from '@material-ui/core';

import { PhaseAllocationForm } from '../../components/modal-forms/PhaseAllocationForm';

export const SetPhaseAllocations = ({ isNew, row, siteId, fetchDetails }) => {
  const [activeModalForm, setActiveModalForm] = useState(null);
  const closeDialog = () => {
    setActiveModalForm(null);
  };

  const openNewPhaseModal = () => {
    setActiveModalForm('set-allocation');
  };

  const handleFormSubmit = (formData) => {
    fetchDetails(siteId);
    closeDialog();
  };

  return (
    <>
      <PhaseAllocationForm
        open={activeModalForm === 'set-allocation'}
        onSubmit={handleFormSubmit}
        onClose={closeDialog}
        isNew={isNew}
        content={row}
        siteId={siteId}
      />
      <Box>
        <Button
          onClick={() => openNewPhaseModal()}
          variant='outlined'
          size='small'
          text={isNew ? 'set' : 'edit'}
        />
      </Box>
    </>
  );
};
