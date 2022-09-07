import React from 'react';
import { Button, Dialog } from '../generic';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePhaseSchema, ToastStatus } from '../../constants';
import { createPhase } from '../../services/site';
import { useToast } from '../../hooks';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
}));

export const NewPhaseDialog = ({ onSubmit, onClose, open }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const initialValues = {
    phaseName: '',
    startDate: '',
    endDate: '',
  };

  const handleCreatePhase = async (phase) => {
    const phaseJson = {
      name: phase.phaseName,
      start_date: phase.startDate,
      end_date: phase.endDate,
    };
    const response = await createPhase(phaseJson);
    if (response.ok) {
      openToast({
        status: ToastStatus.Success,
        message: `Phase '${phase.phaseName}' added successfully`,
      });
      await onSubmit();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  return (
    <Dialog title={'Create Phase'} open={open} onClose={onClose}>
      <Formik
        initialValues={initialValues}
        validationSchema={CreatePhaseSchema}
        onSubmit={handleCreatePhase}
      >
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
    </Dialog>
  );
};
