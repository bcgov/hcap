import React from 'react';

import { Dialog } from '../../generic';
import { EditRosDate } from '../../modal-forms';
import { EditRosDateSchema } from '../../../constants';

export const EditRosDateDialog = ({ isOpen, onClose, onSubmit }) => {
  return (
    <Dialog title='Edit Start Date' open={isOpen}>
      <EditRosDate
        initialValues={{ date: undefined }}
        validationSchema={EditRosDateSchema}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Dialog>
  );
};
