import React, { useState } from 'react';
import { Button, Dialog } from '../generic';
import { Box, Typography } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import { BulkAllocationSchema, ToastStatus } from '../../constants';
import { RenderTextField, RenderSelectField, RenderCheckbox } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { formatLongDate } from '../../utils/date';
import { bulkAllocation } from '../../services/allocations';
import { useToast } from '../../hooks';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
  list: {
    maxHeight: '100px',
    overflow: 'auto',
    overflowX: 'hidden',
  },
}));

export const createSiteNameHash = (arr) =>
  arr.reduce((map, { id, siteName }) => ({ [id]: siteName, ...map }), {});

export const createPhaseDropdown = (phases) => {
  return phases
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    .map((phase) => ({
      value: phase.id,
      label: `${phase.name} - ${formatLongDate(phase.start_date)} -
    ${formatLongDate(phase.end_date)}`,
    }));
};

export const BulkAllocationForm = ({ onClose, afterSubmit, open, sites, phases = [] }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const [existingAllocations, setExistingAllocations] = useState([]);
  const siteIds = sites.map(({ id }) => id);
  const siteNames = createSiteNameHash(sites);
  const initialValues = {
    allocation: '',
    phase_id: '',
    existingAllocations: false,
    acknowledgement: false,
  };

  const handleSetAllocation = (phaseId, setValue) => {
    // get all allocations associated to the selected phase
    const phaseAllocations = phases.find(({ id }) => id === phaseId)?.allocations;
    // filter the allocations and return all that are associated to the sites selected.
    const phaseSiteAllocations = phaseAllocations.filter(({ site_id }) =>
      siteIds.includes(site_id)
    );

    setExistingAllocations(phaseSiteAllocations);
    setValue('existingAllocations', phaseSiteAllocations.length > 0);
  };

  const handleSubmit = async (values) => {
    const payload = {
      siteIds,
      allocation: values.allocation,
      phase_id: values.phase_id,
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
        {({ submitForm, setFieldValue, values }) => (
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
                  handleSetAllocation(target.value, setFieldValue);
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
            {values.existingAllocations && (
              <Box flexGrow={1}>
                <Alert severity='warning'>
                  <Typography variant='body1'>
                    {`The following (${existingAllocations.length}) sites already have allocations assigned:`}
                  </Typography>
                  <ul className={classes.list}>
                    {existingAllocations.map((allocation) => (
                      <li key={allocation.id}>{siteNames[allocation.site_id]}</li>
                    ))}
                  </ul>
                </Alert>
              </Box>
            )}
            {values.existingAllocations && (
              <Box my={3} style={{ gap: '15px' }}>
                <Field
                  name='acknowledgement'
                  component={RenderCheckbox}
                  label='I acknowledge that one or more sites already has an allocation set. Submitting this form will override those allocation.'
                />
              </Box>
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
