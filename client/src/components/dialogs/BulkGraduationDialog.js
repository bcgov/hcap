import React from 'react';
import { Dialog } from '@mui/material';
import { ManageGraduationForm } from '..//modal-forms/ManageGraduationForm';
import { postHireStatuses } from '../../constants';

export const BulkGraduationDialog = ({
  open,
  onClose,
  cohortEndDate,
  onSubmit,
  participantIds,
}) => {
  return (
    <Dialog title={'Set Bulk Graduation Status'} open={open} onClose={onClose}>
      <ManageGraduationForm
        cohortEndDate={cohortEndDate}
        initialValues={{
          status: postHireStatuses.postSecondaryEducationCompleted,
          data: {
            date: cohortEndDate,
          },
          continue: 'continue_yes',
          participantIds,
        }}
        onClose={onClose}
        onSubmit={onSubmit}
        isBulkGraduate
      />
    </Dialog>
  );
};

export default BulkGraduationDialog;
