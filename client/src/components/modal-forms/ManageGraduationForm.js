import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderDateField, RenderRadioGroup } from '../fields';
import React from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { getTodayDate } from '../../utils';
import { Button } from '../../components/generic/Button';
import { ParticipantPostHireStatusSchema } from '../../constants/validation';
import { postHireStatuses } from '../../constants';
export const ManageGraduationForm = ({ initialValues, onClose, onSubmit, cohortEndDate }) => {
  return (
    <Box spacing={10} p={4} maxWidth={400}>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={ParticipantPostHireStatusSchema}
      >
        {({ submitForm, values, setFieldValue }) => {
          const handleStatusChange = ({ target }) => {
            const { value } = target;
            setFieldValue('status', value);
            if (value === postHireStatuses.postSecondaryEducationCompleted) {
              setFieldValue('data.date', cohortEndDate);
            } else {
              setFieldValue('data.date', '');
            }
          };
          return (
            <FormikForm>
              <Box>
                <Typography color={'primary'} variant={'h4'}>
                  {' '}
                  Graduation Status
                </Typography>
                <hr />
                <Field
                  test-id={'editGraduationModalStatus'}
                  name='status'
                  component={RenderRadioGroup}
                  label='Has this participant graduated?'
                  onChange={handleStatusChange}
                  options={[
                    {
                      value: postHireStatuses.postSecondaryEducationCompleted,
                      label: 'Graduated',
                    },
                    {
                      value: postHireStatuses.cohortUnsuccessful,
                      label: 'Unsuccessful cohort',
                    },
                  ]}
                />
                {
                  <Field
                    test-id={'editGraduationModalStatus'}
                    name={'data.date'}
                    label={
                      values.status === postHireStatuses.postSecondaryEducationCompleted
                        ? 'Graduation Date / Cohort End Date     '
                        : 'Estimated Unsuccessful Date'
                    }
                    component={RenderDateField}
                    maxDate={getTodayDate()}
                    disabled={
                      values.status === postHireStatuses.postSecondaryEducationCompleted &&
                      values.data.date === cohortEndDate
                    }
                  />
                }
                <br />
                {values.status === postHireStatuses.cohortUnsuccessful && (
                  <Field
                    test-id={'editGraduationModalContinue'}
                    name='continue'
                    component={RenderRadioGroup}
                    label='Will this participant be continuing in the program?'
                    options={[
                      {
                        value: 'continue_yes',
                        label: 'Yes',
                      },
                      {
                        value: 'continue_no',
                        label: 'No',
                      },
                    ]}
                  />
                )}
                {values?.continue === 'continue_no' &&
                  values.status === postHireStatuses.cohortUnsuccessful && (
                    <Box>
                      <MuiAlert severity='warning'>
                        {
                          'Participants who no longer wish to to continue in HCAP will need to be archived, please use the archive function provided after you submit.'
                        }
                      </MuiAlert>
                    </Box>
                  )}
                <hr />
                <Box mt={3}>
                  <Grid container spacing={2} justify='flex-end'>
                    <Grid item>
                      <Button onClick={onClose} color='default' text='Cancel' />
                    </Grid>
                    <Grid item>
                      <Button
                        onClick={submitForm}
                        variant='contained'
                        color='primary'
                        text='Submit'
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </FormikForm>
          );
        }}
      </Formik>
    </Box>
  );
};
