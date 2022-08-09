import React, { useState } from 'react';

import { Box, Divider, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderAutocomplete, RenderDateField } from '../fields';
import { Button, Dialog } from '../generic';
import { mohEditType } from '../../constants';

const useStyles = makeStyles((theme) => ({
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
}));

export const EditParticipantField = ({
  initialValues,
  onSubmit,
  onClose,
  validationSchema,
  type,
  fieldName,
  fieldLabel,
  fieldOptions,
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
              {type === mohEditType.DATE && (
                <Box my={1}>
                  <FastField
                    name={fieldName}
                    component={RenderDateField}
                    label={fieldLabel}
                    boldLabel
                  />
                </Box>
              )}

              {type === mohEditType.AUTOCOMPLETE && (
                <Box my={1}>
                  <FastField
                    name={fieldName}
                    component={RenderAutocomplete}
                    label={fieldLabel}
                    boldLabel
                    options={fieldOptions || []}
                  />
                </Box>
              )}

              <Divider className={classes.formDivider} />

              <Box display='flex' justifyContent='space-between'>
                <Button
                  className={classes.formButton}
                  onClick={onClose}
                  variant='outlined'
                  text='Cancel'
                />
                <Button
                  className={classes.formButton}
                  onClick={async () => {
                    setSubmitting(false);
                    const res = await validateForm();
                    if (Object.entries(res)?.length === 0) {
                      openConfirmationDialog(values);
                      return;
                    }
                    await submitForm();
                  }}
                  text='Submit'
                />
              </Box>
            </Box>
          </FormikForm>
        )}
      </Formik>

      <Dialog
        title={'Confirm your changes'}
        open={isConfirmationOpen}
        onClose={closeConfirmationDialog}
      >
        <Box mb={2}>
          <Typography variant='body1'>
            You are making changes to this record, please ensure that all data inputted is accurate
          </Typography>

          <Box display='flex' justifyContent='space-between' mt={2}>
            <Button
              className={classes.formButton}
              onClick={closeConfirmationDialog}
              variant='outlined'
              text='Cancel'
            />
            <Button
              className={classes.formButton}
              onClick={async () => {
                await onSubmit(formValues);
                closeConfirmationDialog();
              }}
              text='Confirm'
            />
          </Box>
        </Box>
      </Dialog>
    </>
  );
};
