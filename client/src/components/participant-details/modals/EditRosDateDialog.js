import React from 'react';

import { Dialog } from '../../generic';
import { EditRosDateForm } from '../../modal-forms';
import { EditRosDateSchema } from '../../../constants';
import { formatShortDate } from '../../../utils';

export const EditRosDateDialog = ({ isOpen, onClose, onSubmit, rosData }) => {
  return (
    <Dialog title='Edit Start Date' open={isOpen} onClose={onClose}>
      <EditRosDateForm
        initialValues={{ date: formatShortDate(rosData?.date) }}
        validationSchema={EditRosDateSchema}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Dialog>
  );
};
