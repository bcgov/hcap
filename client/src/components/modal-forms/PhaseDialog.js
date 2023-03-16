import React, { useState, useEffect } from 'react';
import { Button, Dialog } from '../generic';
import { Typography } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePhaseSchema, ToastStatus } from '../../constants';
import { createPhase, updatePhase, fetchPhases } from '../../services/phases';
import { useToast } from '../../hooks';
import { formatLongDate } from '../../utils/date';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
  list: {
    overflow: 'auto',
    maxHeight: '250px',
    overflowX: 'hidden',
  },
  listItem: {
    fontSize: '14px',
    paddingTop: '0',
    paddingBottom: '0',
  },
}));

export const PhaseDialog = ({ onSubmit, onClose, open, content, isNew = false }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const [phases, setPhases] = useState([]);
  const [isPendingRequests, setIsPendingRequests] = useState(true);

  useEffect(() => {
    // reset state to re-fetch data if dialog is re-opened
    if (!open) {
      setIsPendingRequests(true);
    }
    if (isPendingRequests && open) {
      const fetchData = async () => {
        let phases = await fetchPhases();
        setPhases(phases);
        setIsPendingRequests(false);
      };

      fetchData();
    }
  }, [isPendingRequests, content, open]);

  const initialValues = content
    ? {
        id: content.id,
        phaseName: content.name ?? '',
        startDate: content.start_date ?? '',
        endDate: content.end_date ?? '',
      }
    : {
        id: null,
        phaseName: '',
        startDate: '',
        endDate: '',
      };

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

  return (
    <Dialog title={isNew ? 'Create Phase' : 'Edit Phase'} open={open} onClose={onClose}>
      <Formik
        initialValues={{ ...initialValues, phases: phases }}
        validationSchema={CreatePhaseSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ submitForm, errors }) => {
          // yup error message is a string - convert to an array of Id's to allow for a dynamic error message
          const phaseErrors = errors?.phases?.split(',').map(Number) || [];
          return (
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
                    <p className='MuiFormHelperText-root Mui-error'>
                      {errors?.phases ? 'Conflict with 1 or more phases' : ''}
                    </p>
                  </Box>
                  <Box flexGrow={1}>
                    <Field name='endDate' component={RenderDateField} label='* End date' />
                    <p className='MuiFormHelperText-root Mui-error'>
                      {errors?.phases ? 'Conflict with 1 or more phases' : ''}
                    </p>
                  </Box>
                </Box>
              </Box>

              {errors?.phases || phaseErrors.length > 0 ? (
                <Box flexGrow={1}>
                  <Alert severity='warning'>
                    <Typography variant='body1'>
                      The dates selected overlap with the following phases:
                    </Typography>
                    <ul className={classes.list}>
                      {phases
                        .filter((phase) => phaseErrors.includes(phase.id))
                        .map((phase) => (
                          <li key={phase.id} className={classes.listItem}>
                            {phase.name}:{' '}
                            <b>
                              {formatLongDate(phase.start_date)} - {formatLongDate(phase.end_date)}
                            </b>
                          </li>
                        ))}
                    </ul>
                    <Typography variant='body1'>
                      {isNew
                        ? ` Note: The new phase cannot overlap with current or past phases. Please update
                      the dates in the above phases before creating a new phase.`
                        : `Note: The selected phase cannot overlap with current or past phases. Please update
                      the dates in the above phases before editing`}
                    </Typography>
                  </Alert>
                </Box>
              ) : (
                <div />
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
                  text={isNew ? 'Create' : 'Update'}
                />
              </Box>
            </FormikForm>
          );
        }}
      </Formik>
    </Dialog>
  );
};
