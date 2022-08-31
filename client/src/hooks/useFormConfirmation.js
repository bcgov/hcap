import React, { useState } from 'react';

import { ConfirmationDialog } from '../components/modal-forms/form-components';

/**
 * Given a function to call on confirmation and a warning message, this hook
 * returns a function to open the confirmation and the confirmation component.
 *
 * This function handles the open state for the confirmation a well as calling
 * the form's submit handler
 *
 * @param {*} handleConfirmation function to call when confirmation is affirmed
 * @param {*} warningMessage message to display in the confirmation dialog
 * @returns an array containing a function to open the confirmation and a confirmation component
 */
export const useFormConfirmation = (handleConfirmation, warningMessage) => {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState(null);

  const openConfirmation = (values) => {
    setValues(values);
    setIsOpen(true);
  };
  const closeConfirmation = () => setIsOpen(false);

  const FormConfirmation = () => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={closeConfirmation}
      handleConfirmation={() => handleConfirmation(values)}
      warningMessage={warningMessage}
    />
  );

  return [openConfirmation, FormConfirmation];
};
