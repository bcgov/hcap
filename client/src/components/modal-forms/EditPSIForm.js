import React from 'react';
import Grid from '@mui/material/Grid';
import { Button } from '../generic';
import { Box } from '@mui/material';
import { RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePSISchema } from '../../constants';

export const EditPSIForm = ({ initialValues, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={CreatePSISchema} onSubmit={onSubmit}>
      {({ submitForm, values }) => (
        <FormikForm>
          <Box>
            <Field name='instituteName' component={RenderTextField} label='* Institute Name' />
            <Field name='streetAddress' component={RenderTextField} label='* Street Address' />
            <Field name='city' component={RenderTextField} label='* City' />
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
