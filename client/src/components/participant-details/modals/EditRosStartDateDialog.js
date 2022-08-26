import React from 'react';

import { Dialog } from '../../generic';
import { EditRosStartDateForm } from '../../modal-forms';
import { EditRosStartDateSchema } from '../../../constants';

export const EditRosStartDateDialog = ({ isOpen, onClose, onSubmit }) => {
  return (
    <Dialog title='Edit Start Date at a Current Site' open={isOpen}>
      <EditRosStartDateForm
        initialValues={{ startDate: undefined }}
        validationSchema={EditRosStartDateSchema}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Dialog>
  );
};
