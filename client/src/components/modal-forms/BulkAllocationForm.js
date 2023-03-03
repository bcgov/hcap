import React, { useState } from 'react';
import { Button, Dialog } from '../generic';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { BulkAllocationSchema, ToastStatus } from '../../constants';
import { RenderTextField, RenderSelectField, RenderCheckbox } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { dateToTextString } from '../../utils/date';
import { bulkAllocation } from '../../services/allocations';
import { useToast } from '../../hooks';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
}));

export const createPhaseDropdown = (phases) => {
  return phases.map((phase) => ({
    value: phase.id,
    label: `${phase.name} - ${dateToTextString(phase.start_date)} -
    ${dateToTextString(phase.end_date)}`,
  }));
};

export const BulkAllocationForm = ({ onClose, afterSubmit, open, sites, phases = [] }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const siteIds = sites.map(({ id }) => id);
  const [existingAllocations, setExistingAllocations] = useState([]);
  const initialValues = {
    allocation: '',
    phase_id: '',
  };

  const handleSetAllocation = (phaseId) => {
    // get all allocations associated to the selected phase
    // filter the allocations and return all that are associated to the sites selected.
    const allocations = phases
      .find(({ id }) => id === phaseId)
      ?.allocations.filter(({ site_id }) => siteIds.includes(site_id))
      .map(({ id, allocation, phase_id, site_id }) => ({
        id,
        allocation,
        phase_id,
        site_id,
      }));

    setExistingAllocations(allocations);
  };

  const handleSubmit = async (values) => {
    const payload = {
      siteIds,
      ...values,
      existingAllocations: existingAllocations,
    };
    const response = await bulkAllocation(payload);
    if (response.ok) {
      await afterSubmit();
      openToast({
        status: ToastStatus.Success,
        message: `${sites.length} sites have been assigned allocations`,
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  return (
    <Dialog title='Set Allocation' open={open} onClose={onClose}>
      <Typography variant='body1'>
        <b> {sites.length} sites selected</b>
      </Typography>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={BulkAllocationSchema}
      >
        {({ submitForm, setFieldValue }) => (
          <FormikForm>
            <Box my={3} style={{ gap: '25px' }}>
              <Field
                name='phase_id'
                type='number'
                component={RenderSelectField}
                placeholder='Select phase'
                label='* Phase name'
                options={createPhaseDropdown(phases)}
                onChange={({ target }) => {
                  handleSetAllocation(target.value);
                  setFieldValue('phase_id', target.value);
                }}
              />
            </Box>
            <Box my={3} style={{ gap: '25px' }}>
              <Field
                name='allocation'
                component={RenderTextField}
                type='number'
                label='* Number of allocation'
                placeholder='Type or select'
              />
            </Box>
            {existingAllocations.length > 0 && (
              <Field
                name='acknowledgement'
                component={RenderCheckbox}
                label='I acknowledge that one or more site already has an allocation set. Submitting this form will override those allocation.'
              />
            )}
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
