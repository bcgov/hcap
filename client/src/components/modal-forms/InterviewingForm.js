import React from 'react';
import Grid from '@mui/material/Grid';
import { Button } from '../generic';
import { Box } from '@mui/material';
import { RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { getTodayDate } from '../../utils';

export const InterviewingForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            <Field
              name='contactedDate'
              component={RenderDateField}
              maxDate={getTodayDate()}
              label='* Contacted Date'
            />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justifyContent='flex-end'>
              <Grid item>
                <Button onClick={onClose} text='Cancel' />
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
