import React, { useState, useEffect } from 'react';
import { Button, Dialog } from '../generic';
import { Typography, Box, styled } from '@mui/material';
import Alert from '@mui/material/Alert';
import { RenderTextField, RenderDateField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePhaseSchema, ToastStatus } from '../../constants';
import { createPhase, updatePhase, fetchPhases } from '../../services/phases';
import { useToast } from '../../hooks';
import { formatLongDate } from '../../utils/date';

const FormButton = styled(Button)(({ theme }) => ({
  maxWidth: '200px',
}));

const FormRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '25px',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const List = styled('ul')(({ theme }) => ({
  overflow: 'auto',
  maxHeight: '250px',
  overflowX: 'hidden',
  paddingLeft: theme.spacing(2),
}));

const ListItem = styled('li')(({ theme }) => ({
  fontSize: '14px',
  paddingTop: 0,
  paddingBottom: 0,
}));

export const PhaseDialog = ({ onSubmit, onClose, open, content, isNew = false }) => {
  const { openToast } = useToast();
  const [phases, setPhases] = useState([]);
  const [isPendingRequests, setIsPendingRequests] = useState(true);

  useEffect(() => {
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

                <FormRow>
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
                </FormRow>
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
                          <ListItem key={phase.id}>
                            {phase.name}:{' '}
                            <b>
                              {formatLongDate(phase.start_date)} - {formatLongDate(phase.end_date)}
                            </b>
                          </ListItem>
                        ))}
                    </List>
                    <Typography variant='body1'>
                      {isNew
                        ? `Note: The new phase cannot overlap with current or past phases. Please update the dates in the above phases before creating a new phase.`
                        : `Note: The selected phase cannot overlap with current or past phases. Please update the dates in the above phases before editing.`}
                    </Typography>
                  </Alert>
                </Box>
              ) : (
                <div />
              )}

              <Box display='flex' justifyContent='space-between' my={3}>
                <FormButton onClick={onClose} color='default' text='Cancel' />
                <FormButton
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
