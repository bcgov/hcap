import React from 'react';
import Grid from '@mui/material/Grid';
import { Button } from '../../components/generic';
import { Box } from '@mui/material';
import { RenderSelectField } from '../../components/fields';
import { Field, Formik, Form as FormikForm } from 'formik';

export const RejectedForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            <Field
              name='finalStatus'
              component={RenderSelectField}
              label='* Participant Final Status'
              options={[
                { value: 'withdrawn', label: 'Withdrawn at Participant Request' },
                { value: 'position filled', label: 'Not Hired – Position Filled' },
                { value: 'not qualified', label: 'Not Hired – Participant Not Qualified' },
                { value: 'not responsive', label: 'Not Hired - Unable to Contact Participant' },
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
