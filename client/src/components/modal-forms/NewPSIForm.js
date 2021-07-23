import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';

export const NewPSIForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm, values }) => (
        <FormikForm>
          <Box>
            <Field name='instituteName' component={RenderTextField} label='* Institute Name' />
            <Field name='postalCode' component={RenderTextField} label='* Postal Code' />
            <Field
              name='healthAuthority'
              component={RenderSelectField}
              label='* Health Authority'
              options={[
                { value: 'Interior', label: 'Interior Health' },
                { value: 'Fraser', label: 'Fraser Health' },
                { value: 'Vancouver Coastal', label: 'Vancouver Coastal Health' },
                { value: 'Vancouver Island', label: 'Vancouver Island Health' },
                { value: 'Northern', label: 'Northern Health' },
              ]}
            />
            <Field
              name='availableSeats'
              type='number'
              component={RenderTextField}
              label='Available Seats'
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
