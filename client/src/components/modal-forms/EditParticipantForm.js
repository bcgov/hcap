import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';

export const EditParticipantForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm, values }) => (
        <FormikForm>
          <Box>
            <Field name='firstName' component={RenderTextField} label='First Name' />
            <Field name='lastName' component={RenderTextField} label='Last Name' />
            <Field
              name='phoneNumber'
              component={RenderTextField}
              label='* Phone Number'
              type='tel'
            />
            <Field
              name='emailAddress'
              component={RenderTextField}
              label='* Email Address'
              type='email'
            />
            <Field name='postalCode' component={RenderTextField} label='* Postal Code' type='text' />
            <Field
              name='interested'
              component={RenderSelectField}
              label='Program Interest'
              options={[
                { value: 'yes', label: 'Interested' },
                { value: 'withdrawn', label: 'Withdrawn' },
              ]}
            />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justify='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                <Button onClick={submitForm} variant='contained' color='primary' text='Save' />
              </Grid>
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
