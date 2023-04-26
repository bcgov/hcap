import React from 'react';
import Grid from '@material-ui/core/Grid';

import { Box } from '@material-ui/core';
import { Formik, Form as FormikForm } from 'formik';
import { Button } from '../generic';

export const UserManagementForm = ({
  initialValues,
  handleSubmit,
  onClose,
  children,
  isLoading,
  schema,
}) => {
  return (
    <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
      {(formikProps) => {
        return (
          <FormikForm>
            <Box>{children(formikProps)}</Box>
            <Box my={2}>
              <Grid container spacing={2} justify='flex-end'>
                <Grid item>
                  <Button onClick={onClose} color='default' text='Cancel' />
                </Grid>
                <Grid item>
                  <Button
                    onClick={formikProps.submitForm}
                    variant='contained'
                    color='primary'
                    text='Submit'
                    disabled={isLoading}
                  />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
        );
      }}
    </Formik>
  );
};
