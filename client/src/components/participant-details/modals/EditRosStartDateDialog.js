import React from 'react';

import { Dialog } from '../../generic';
import { EditRosStartDateForm } from '../../modal-forms';
import { EditRosStartDateSchema } from '../../../constants';
import { formatShortDate } from '../../../utils';

export const EditRosStartDateDialog = ({ isOpen, onClose, onSubmit, rosData }) => {
  return (
    <Dialog title='Edit Start Date at a Current Site' open={isOpen}>
      <EditRosStartDateForm
        initialValues={{ startDate: formatShortDate(rosData?.startDate) }}
        validationSchema={EditRosStartDateSchema}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Dialog>
  );
};
