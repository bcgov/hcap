import React, { useState } from 'react';
import { Button } from '../../components/generic';
import { Box } from '@material-ui/core';

import { BulkAllocationForm } from '../../components/modal-forms/BulkAllocationForm';

export const SetBulkAllocation = ({ sites }) => {
  const [activeModalForm, setActiveModalForm] = useState(null);
  const closeDialog = () => {
    setActiveModalForm(null);
  };

  const openBulkAllocationModal = () => {
    setActiveModalForm('bulk-allocation');
  };

  return (
    <>
      <BulkAllocationForm
        open={activeModalForm === 'bulk-allocation'}
        onClose={closeDialog}
        sites={sites}
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
