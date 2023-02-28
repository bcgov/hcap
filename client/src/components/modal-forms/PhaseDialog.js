import React, { useState, useEffect } from 'react';
import { Button, Dialog } from '../generic';
import { Box, Typography, List, ListItem, ListItemText } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePhaseSchema, ToastStatus } from '../../constants';
import { createPhase, updatePhase, fetchPhases } from '../../services/phases';
import { useToast } from '../../hooks';
import dayjs from 'dayjs';

const useStyles = makeStyles(() => ({
  formButton: {
    maxWidth: '200px',
  },
  formRow: {
    gap: '25px',
  },
  listItem: {
    paddingTop: '0',
    paddingBottom: '0',
  },
}));

export const PhaseDialog = ({ onSubmit, onClose, open, content, isNew = false }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const [phases, setPhases] = useState([]);

  const fetchData = async () => {
    let phases = await fetchPhases();
    // remove the phases getting edited from the validation
    if (content) {
      phases = phases.filter(({ id }) => id !== content.id);
    }
    setPhases(phases);
  };

  useEffect(() => {
    fetchData();
  }, [content]);

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
        enableReinitialize={true}
        validationSchema={CreatePhaseSchema}
        onSubmit={handleSubmit}
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
                    <List>
                      {phases
                        .filter((phase) => phaseErrors.includes(phase.id))
                        .map((phase) => (
                          <ListItem key={phase.id} className={classes.listItem}>
                            <ListItemText
                              primary={`${phase.name}: ${dayjs
                                .utc(phase.start_date)
                                .format('MMM DD, YYYY')} -
                          ${dayjs.utc(phase.end_date).format('MMM DD, YYYY')}`}
                            />
                          </ListItem>
                        ))}
                    </List>
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
