import React from 'react';
import Grid from '@mui/material/Grid';
import { Button } from '../generic';
import { Box } from '@mui/material';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { NewCohortSchema } from '../../constants';

export const NewCohortForm = ({ initialValues, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={NewCohortSchema} onSubmit={onSubmit}>
      {({ submitForm, values }) => (
        <FormikForm>
          <Box>
            <Field name='cohortName' component={RenderTextField} label='* Cohort Name' />
            <Field name='startDate' component={RenderDateField} label='* Start Date' />
            <Field name='endDate' component={RenderDateField} label='* End Date' />
            <Field
              name='cohortSize'
              type='number'
              component={RenderTextField}
              label='* Cohort Size'
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
