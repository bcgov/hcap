import React, { useState } from 'react';

import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Formik, Form as FormikForm } from 'formik';

import { ConfirmationDialog, FormButtons } from './';

const useStyles = makeStyles((theme) => ({
  formDivider: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
}));

export const EditRosTemplate = ({
  initialValues,
  onSubmit,
  onClose,
  validationSchema,
  children,
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
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
        {({ validateForm, submitForm, values, setSubmitting }) => (
          <FormikForm>
            <Box mb={2}>
              {children}

              <Divider className={classes.formDivider} />

              <FormButtons
                onClose={onClose}
                onSubmit={async () => {
                  setSubmitting(false);
                  const res = await validateForm();
                  if (Object.entries(res)?.length === 0) {
                    openConfirmationDialog(values);
                    return;
                  }
                  await submitForm();
                }}
              />
            </Box>
          </FormikForm>
        )}
      </Formik>

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
