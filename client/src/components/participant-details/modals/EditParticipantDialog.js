import React from 'react';

import { Dialog } from '../../generic';
import { EditParticipantFormSchema } from '../../../constants';
import { EditParticipantForm } from '../../modal-forms';

export const EditParticipantDialog = ({ isOpen, onClose, onSubmit, participant }) => {
  return (
    <Dialog title='Edit Participant Info' open={isOpen} onClose={onClose}>
      <EditParticipantForm
        initialValues={participant}
        validationSchema={EditParticipantFormSchema}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Dialog>
  );
};
