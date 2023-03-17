import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderDateField, RenderRadioGroup } from '../fields';
import React, { useMemo } from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { Button } from '../../components/generic/Button';
import { makeStyles } from '@material-ui/core/styles';
import { AuthContext } from '../../providers';
import { ParticipantPostHireStatusSchema } from '../../constants/validation';
import { postHireStatuses } from '../../constants';

const useStyles = makeStyles(() => ({
  list: {
    maxHeight: '100px',
    overflow: 'auto',
    overflowX: 'hidden',
  },
}));

export const ManageGraduationForm = ({
  initialValues,
  onClose,
  onSubmit,
  cohortEndDate,
  isBulkGraduate = false,
  participants = [],
}) => {
  const classes = useStyles();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const showOverrideAlert = isBulkGraduate && participants.length > 0;

  return (
    <Box spacing={10} p={4} width={380}>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={ParticipantPostHireStatusSchema}
      >
        {({ submitForm, values, setFieldValue, setFieldTouched }) => {
          const handleStatusChange = ({ target }) => {
            const { value } = target;
            setFieldValue('status', value);
            if (value === postHireStatuses.postSecondaryEducationCompleted) {
              setFieldValue('data.date', cohortEndDate);
              setFieldTouched('data.date', false);
              setFieldValue('continue', 'continue_yes');
            } else {
              setFieldValue('data.date', '');
              setFieldTouched('data.date', false);
            }
          };

          const isGraduatingBeforeCohortEndDate =
            values.status === postHireStatuses.postSecondaryEducationCompleted &&
            new Date(cohortEndDate) > new Date(values.data.date);
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
                    !isBulkGraduate && {
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
                        : 'Withdrawal date from cohort'
                    }
                    component={RenderDateField}
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
                          'Participants who no longer wish to continue in HCAP will need to be archived, please use the archive function provided after you submit.'
                        }
                      </MuiAlert>
                    </Box>
                  )}
                {values?.continue === 'continue_yes' &&
                  values.status === postHireStatuses.cohortUnsuccessful &&
                  !roles.includes('health_authority') && (
                    <Box>
                      <MuiAlert severity='warning'>
                        {
                          'Please notify your Health Authority contact to assign a new Cohort to the participant.'
                        }
                      </MuiAlert>
                    </Box>
                  )}
                {isGraduatingBeforeCohortEndDate && (
                  <MuiAlert severity='warning'>
                    {'Graduation cannot be tracked before cohort has ended.'}
                  </MuiAlert>
                )}
                {showOverrideAlert && (
                  <Box flexGrow={1}>
                    <MuiAlert severity='warning'>
                      <Typography variant='body1'>
                        The following participants already have a graduation status Submitting this
                        form will override this status.
                      </Typography>
                      <ul className={classes.list}>
                        {participants.map((participant) => (
                          <li
                            key={participant.id}
                          >{`${participant.body.firstName} ${participant.body.lastName}`}</li>
                        ))}
                      </ul>
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
                        disabled={isGraduatingBeforeCohortEndDate}
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
