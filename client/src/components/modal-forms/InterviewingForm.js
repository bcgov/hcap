import React from 'react';
import { Grid, Box } from '@mui/material';
import { Button } from '../generic';
import { RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { dayUtils } from '../../utils';

export const InterviewingForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            <Field
              name='contactedDate'
              component={RenderDateField}
              maxDate={dayUtils()}
              label='* Contacted Date'
            />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justify='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                <Button onClick={submitForm} variant='contained' color='primary' text='Submit' />
              </Grid>
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
