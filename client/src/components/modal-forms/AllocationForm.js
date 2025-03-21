import React from 'react';
import { Button, Dialog } from '../generic';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreateAllocationSchema, ToastStatus } from '../../constants';
import { createAllocation, updateAllocation } from '../../services';
import { useToast } from '../../hooks';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
}));

export const AllocationForm = ({ onSubmit, onClose, open, content, isNew, siteId }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const initialValues = content
    ? {
        allocation: content.allocation ?? '',
        mhawAllocation: content.mhawAllocation ?? '',
        startDate: content.startDate ?? '',
        endDate: content.endDate ?? '',
      }
    : {
        allocation: '',
        mhawAllocation: '',
        startDate: '',
        endDate: '',
      };

  const handleSubmit = async (allocation) => {
    const allocationJson = isNew
      ? {
          allocation: allocation.allocation,
          mhaw_allocation: allocation.mhawAllocation,
          phase_id: content.id,
          site_id: parseInt(siteId, 10),
        }
      : {
          allocation: allocation.allocation,
          mhaw_allocation: allocation.mhawAllocation,
        };
    const response = await (isNew
      ? createAllocation(allocationJson)
      : updateAllocation(content.allocationId, allocationJson));
    if (response.ok) {
      openToast({
        status: ToastStatus.Success,
        message: isNew
          ? `New phase allocation has been successfully assigned`
          : `Phase allocation has been successfully updated`,
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
    <Dialog title={isNew ? 'Set Allocation' : 'Edit Allocation'} open={open} onClose={onClose}>
      <Typography variant='body1'>
        Phase name:
        <b> {content.phaseName}</b>
      </Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={CreateAllocationSchema}
        onSubmit={handleSubmit}
      >
        {({ submitForm }) => (
          <FormikForm>
            <Box>
              <Box
                display='flex'
                justifyContent='space-between'
                my={3}
                style={{ gap: '25px' }}
                className={classes.formRow}
              >
                <Box flexGrow={1}>
                  <Field name='startDate' component={RenderDateField} label='Start date' disabled />
                </Box>
                <Box flexGrow={1}>
                  <Field name='endDate' component={RenderDateField} label='End date' disabled />
                </Box>
              </Box>
              <Box
                display='flex'
                justifyContent='space-between'
                my={3}
                style={{ gap: '25px' }}
                className={classes.formRow}
              >
                <Box flexGrow={1}>
                  <Field
                    name='allocation'
                    component={RenderTextField}
                    type='number'
                    label='* HCA allocation'
                    placeholder='Type HCA allocation'
                  />
                </Box>
                <Box flexGrow={1}>
                  <Field
                    name='mhawAllocation'
                    component={RenderTextField}
                    type='number'
                    label='* MHAW allocation'
                    placeholder='Type MHAW allocation'
                  />
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
                text='Set'
              />
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Dialog>
  );
};
