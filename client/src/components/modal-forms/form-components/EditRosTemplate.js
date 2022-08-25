import React, { useState } from 'react';

import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { ConfirmationDialog, FormButtons } from './';

const useStyles = makeStyles((theme) => ({
  formDivider: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
}));

export const EditRosTemplate = ({
  onSubmit,
  onClose,
  children,
  values,
  getValidationResult,
  showConfirmationDialog = true,
}) => {
  const classes = useStyles();
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [formValues, setFormValues] = useState(null);

  const openConfirmationDialog = (values) => {
    setFormValues(values);
    setConfirmationOpen(true);
  };
  const closeConfirmationDialog = () => {
    setFormValues(null);
    setConfirmationOpen(false);
  };

  return (
    <>
      <Box mb={2}>
        {children}
        <Divider className={classes.formDivider} />

        <FormButtons
          onClose={onClose}
          onSubmit={async () => {
            const isFormValid = await getValidationResult();
            if (!isFormValid) {
              return;
            }
            if (showConfirmationDialog) {
              openConfirmationDialog(values);
              return;
            }
            await onSubmit(formValues);
          }}
        />
      </Box>

      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        onClose={closeConfirmationDialog}
        onSubmit={async () => {
          await onSubmit(formValues);
          closeConfirmationDialog();
        }}
        warningMessage='You are making changes to this record, please ensure that all data inputted is accurate'
      />
    </>
  );
};
