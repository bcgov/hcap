import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePSISchema, healthAuthorities } from '../../constants';

export const NewPSIForm = ({ initialValues, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={CreatePSISchema} onSubmit={onSubmit}>
      {({ submitForm, values }) => (
        <FormikForm>
          <Box>
            <Field name='instituteName' component={RenderTextField} label='* Institute Name' />
            <Field name='streetAddress' component={RenderTextField} label='Street Address' />
            <Field name='city' component={RenderTextField} label='City' />
            <Field name='postalCode' component={RenderTextField} label='* Postal Code' />
            <Field
              name='healthAuthority'
              component={RenderSelectField}
              label='* Health Authority'
              options={healthAuthorities}
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
