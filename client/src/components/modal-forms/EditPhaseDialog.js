import React from 'react';
import { Button, Dialog } from '../generic';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePhaseSchema, ToastStatus } from '../../constants';
import { updatePhase } from '../../services/phases';
import { useToast } from '../../hooks';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
}));

export const EditPhaseDialog = ({ onSubmit, onClose, open, content }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const initialValues = {
    phaseName: content.name ?? '',
    startDate: content.start_date ?? '',
    endDate: content.end_date ?? '',
  };

  const handleEditPhase = async (phase) => {
    const phaseJson = {
      name: phase.phaseName,
      start_date: phase.startDate,
      end_date: phase.endDate,
    };
    const response = await updatePhase(content.id, phaseJson);
    if (response.ok) {
      openToast({
        status: ToastStatus.Success,
        message: `Phase '${phase.phaseName}' updated successfully`,
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
    <Dialog title={'Edit Phase'} open={open} onClose={onClose}>
      <Formik
        initialValues={initialValues}
        validationSchema={CreatePhaseSchema}
        onSubmit={handleEditPhase}
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
                text='Update'
              />
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Dialog>
  );
};
