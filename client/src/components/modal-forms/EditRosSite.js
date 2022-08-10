import React, { useState } from 'react';
import _orderBy from 'lodash/orderBy';

import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { ConfirmationForm, FormButtons } from './form-components';
import { RenderAutocomplete } from '../fields';
import { MAX_LABEL_LENGTH } from '../../constants';
import { addEllipsisMask } from '../../utils';

const useStyles = makeStyles((theme) => ({
  formDivider: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
}));

export const EditRosSite = ({ initialValues, onSubmit, onClose, validationSchema, sites }) => {
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
              <Box my={1}>
                <FastField
                  name='siteName'
                  component={RenderAutocomplete}
                  label='Site'
                  boldLabel
                  options={_orderBy(sites, ['siteName']).map((item) => ({
                    value: item.siteId,
                    label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
                  }))}
                />
              </Box>

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

      <ConfirmationForm
        isOpen={isConfirmationOpen}
        onClose={closeConfirmationDialog}
        onSubmit={async () => {
          await onSubmit(formValues);
          closeConfirmationDialog();
        }}
      />
    </>
  );
};
