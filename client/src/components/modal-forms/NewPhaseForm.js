import React from 'react';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
}));

export const NewPhaseForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  const classes = useStyles();

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            <Field name='phaseName' component={RenderTextField} label='* Phase name' />
            <Box
              display='flex'
              justifyContent='space-between'
              my={3}
              style={{ gap: '25px' }}
              className={classes.formRow}
            >
              <Box flexGrow={1}>
                <Field name='startDate' component={RenderDateField} label='* Start date' />
              </Box>
              <Box flexGrow={1}>
                <Field name='endDate' component={RenderDateField} label='* End date' />
              </Box>
            </Box>
          </Box>

          <Box display='flex' justifyContent='space-between' my={3}>
            <Button
              className={classes.formButton}
              onClick={onClose}
              color='default'
              text='Cancel'
            />
            <Button
              className={classes.formButton}
              onClick={submitForm}
              variant='contained'
              color='primary'
              text='Create'
            />
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
