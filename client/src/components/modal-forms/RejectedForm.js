import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../../components/generic';
import { Box } from '@material-ui/core';
import { RenderSelectField } from '../../components/fields';
import { Field, Formik, Form as FormikForm } from 'formik';

export const RejectedForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    onSubmit={onSubmit}
  >
    {({ submitForm }) => (
      <FormikForm>
        <Box>
          <Field
            name="finalStatus"
            component={RenderSelectField}
            label="* Participant Final Status"
            options={[
              { value: 'withdrawn', label: 'Withdrawn at Participant Request' },
              { value: 'position filled', label: 'Not Hired – Position Filled' },
              { value: 'not qualified', label: 'Not Hired – Participant Not Qualified' },
            ]}
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
