import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { NewCohortSchema } from '../../constants';

export const CohortForm = ({
  initialValues = {
    cohortName: '',
    startDate: '',
    endDate: '',
    cohortSize: '',
  },
  onSubmit,
  onClose,
  schema,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema || NewCohortSchema}
      onSubmit={onSubmit}
    >
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
