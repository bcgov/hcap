import React from 'react';

import { Dialog } from '../../../../components/generic';
import { EditParticipantField } from '../../../../components/modal-forms';

const rosInitialValues = {
  siteName: undefined,
  date: undefined,
  startDate: undefined,
};

export const EditRosFieldDialog = ({
  isOpen,
  onClose,
  onSubmit,
  validation,
  title,
  rosFieldType,
  fieldName,
  fieldLabel,
  fieldOptions,
}) => {
  return (
    <Dialog title={title} open={isOpen}>
      <EditParticipantField
        initialValues={rosInitialValues}
        validationSchema={validation}
        onSubmit={onSubmit}
        onClose={onClose}
        type={rosFieldType}
        fieldName={fieldName}
        fieldLabel={fieldLabel}
        fieldOptions={fieldOptions}
      />
    </Dialog>
  );
};
