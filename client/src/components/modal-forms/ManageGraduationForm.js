import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderCheckbox, RenderDateField, RenderRadioGroup } from '../fields';
import React from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import { getTodayDate } from '../../utils';
import { Button } from '../../components/generic/Button';
import { ParticipantPostHireStatusSchema } from '../../constants/validation';
import { postHireStatuses } from '../../constants';
export const ManageGraduationForm = ({ initialValues, onClose, onSubmit, cohortEndDate }) => {
  return (
    <Box spacing={10} p={5}>
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
                        ? 'Graduation Date'
                        : 'Unsuccessful Graduation Date'
                    }
                    component={RenderDateField}
                    maxDate={getTodayDate()}
                    disabled={
                      values.status === postHireStatuses.postSecondaryEducationCompleted &&
                      values.data.date === cohortEndDate
                    }
                  />
                }
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
                {values?.continue === 'continue_no' && (
                  <Field
                    test-id={'editGraduationModalWithdraw'}
                    name='withdraw'
                    component={RenderCheckbox}
                    label='Withdraw this participant from the program.'
                  />
                )}

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
