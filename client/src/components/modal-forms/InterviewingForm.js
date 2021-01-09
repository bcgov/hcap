import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';

export const InterviewingForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {

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
    {({ submitForm }) => (
      <FormikForm>
        <Box>
          <Field
            name="contactedDate"
            component={RenderDateField}
            maxDate={getTodayDate()}
            label="* Contacted Date"
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
