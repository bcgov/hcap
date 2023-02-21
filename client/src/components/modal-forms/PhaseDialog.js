/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Button, Dialog } from '../generic';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { useFormikContext } from 'formik';
import { CreatePhaseSchema, ToastStatus } from '../../constants';
import { createPhase, updatePhase } from '../../services/phases';
import { useToast } from '../../hooks';
import dayjs from 'dayjs';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
}));

export const PhaseDialog = ({ onSubmit, onClose, open, content, isNew, phases }) => {
  //  const { values } = useFormikContext();
  const values = useFormikContext();
  const { openToast } = useToast();
  const [overlapPhases, setOverlapPhases] = useState([]);
  const classes = useStyles();

  const initialValues = content
    ? {
        phaseName: content.name ?? '',
        startDate: content.start_date ?? '',
        endDate: content.end_date ?? '',
      }
    : {
        phaseName: '',
        startDate: '',
        endDate: '',
      };

  const checkDateOverlap = () => {
    console.log('PHASE @');

    console.log('VALUES');
    // Sort the date array in ascending order based on start_date
    const sorted = phases.sort((a, b) => a.start_date - b.start_date);

    // Loop through each date object in the array
    for (let i = 0; i < sorted.length; i++) {
      let overlappedPhases;
      const current = sorted[i];
      const next = sorted[i + 1];

      // Check if the current date range overlaps with the input date range
      if (
        (values.start_date >= current.start_date && values.start_date <= current.end_date) ||
        (values.end_date >= current.start_date && values.end_date <= current.end_date) ||
        (values.start_date <= current.start_date && values.end_date >= current.end_date)
      ) {
        overlappedPhases.push(current);
        console.log('VALID??');
        return setOverlapPhases(overlappedPhases);
      }

      // Check if the input date range overlaps with the next date range in the array
      if (next && values.end_date >= next.start_date) {
        overlappedPhases.push(next);
        return setOverlapPhases(overlappedPhases);
      }
    }
    return setOverlapPhases([]);
  };

  useEffect(() => {
    if (values && values.start_date && values.end_date) {
      console.log('PHASE !');
      checkDateOverlap();
    }
  }, [values]);

  const handleSubmit = async (phase) => {
    const phaseJson = {
      ...(isNew && { name: phase.phaseName }),
      start_date: phase.startDate,
      end_date: phase.endDate,
    };
    const response = await (isNew ? createPhase(phaseJson) : updatePhase(content.id, phaseJson));
    if (response.ok) {
      openToast({
        status: ToastStatus.Success,
        message: `Phase '${phase.phaseName}' ${isNew ? 'created' : 'updated'} successfully`,
      });
      await onSubmit();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  // console.log(formik.values)

  return (
    <Dialog title={isNew ? 'Create Phase' : 'Edit Phase'} open={open} onClose={onClose}>
      <Formik
        initialValues={initialValues}
        validationSchema={CreatePhaseSchema}
        onSubmit={handleSubmit}
      >
        {({ submitForm }) => (
          <FormikForm>
            <Box>
              <Field
                name='phaseName'
                component={RenderTextField}
                label='* Phase name'
                placeholder='Enter a phase name'
                disabled={!isNew}
              />
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

            <Box flexGrow={1}>
              {overlapPhases.map((phase) => (
                <div key={phase.id} className='MuiFormHelperText-root Mui-error'>
                  <div>
                    {' '}
                    {phase.name} : {dayjs.utc(phase.start_date).format('MMM DD, YYYY')} -{' '}
                    {dayjs.utc(phase.end_date).format('MMM DD, YYYY')}{' '}
                  </div>
                </div>
              ))}
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
                text={isNew ? 'Create' : 'Update'}
              />
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Dialog>
  );
};
