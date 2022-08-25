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

export const EditRosTemplate = ({ onSubmit, onClose, children, values, validateForm }) => {
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
            const errors = await validateForm();
            if (Object.keys(errors).length === 0) {
              openConfirmationDialog(values);
            }
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
