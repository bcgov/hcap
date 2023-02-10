import React, { useState } from 'react';
import { Button } from '../../components/generic';
import { Box } from '@material-ui/core';

import { PhaseAllocationForm } from '../../components/modal-forms/PhaseAllocationForm';

export const SetPhaseAllocations = ({ isNew, row }) => {
  const [activeModalForm, setActiveModalForm] = useState(null);
  const closeDialog = () => {
    setActiveModalForm(null);
  };

  const openNewPhaseModal = () => {
    setActiveModalForm('set-allocation');
  };

  return (
    <>
      <PhaseAllocationForm
        open={activeModalForm === 'set-allocation'}
        onClose={closeDialog}
        isNew={isNew}
        content={row}
      />
      <Box>
        <Button onClick={() => openNewPhaseModal()} variant='outlined' size='small' text='set' />
      </Box>
    </>
  );
};
