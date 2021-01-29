import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderDateField, RenderCheckbox, RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import store from 'store';

export const EditParticipantForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  return <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    onSubmit={onSubmit}
  >
    {({ submitForm, values }) => (
      <FormikForm>
        <Box>
      <Field
      name="firstName"
      component={RenderTextField}
      label="First Name"
      />
      <Field
      name="lastName"
      component={RenderTextField}
      label="Last Name"
      />
      <Field
      name="phoneNumber"
      component={RenderTextField}
      label="* Phone Number"
      type="tel"
      />
      <Field
      name="emailAddress"
      component={RenderTextField}
      label="* Email Address"
      type="email"
      />
      <Field
      name="interested"
      component={RenderSelectField}
      label="Program Interest"
      options={[
        { value: 'yes', label: 'Interested' },
        { value: 'withdrawn', label: 'Withdrawn' },
      ]}
      />
        </Box>
        <Box mt={3}>
          <Grid container spacing={2} justify="flex-end">
            <Grid item>
              <Button
                onClick={onClose}
                color="default"
                text="Cancel"
              />
            </Grid>
            <Grid item>
              <Button
                onClick={submitForm}
                variant="contained"
                color="primary"
                text="Submit"
              />
            </Grid>
          </Grid>
        </Box>
      </FormikForm>
    )}
  </Formik>;
};
