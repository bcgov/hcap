import React from 'react';
import { Button, Dialog } from '../generic';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RenderTextField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
}));

export const BulkAllocationForm = ({ onClose, open, sites }) => {
  const classes = useStyles();
  const initialValues = {
    allocation: '',
  };

  const handleSubmit = async () => {
    console.log('selected sites', sites);
  };
  return (
    <Dialog title='Set Allocation' open={open} onClose={onClose}>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ submitForm }) => (
          <FormikForm>
            <Box>
              <Field
                name='allocation'
                component={RenderTextField}
                type='number'
                label='* Number of allocation'
                placeholder='Type or select'
              />
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
                text='Set'
              />
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Dialog>
  );
};
