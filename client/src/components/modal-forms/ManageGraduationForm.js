import { Field, Formik, Form as FormikForm, useFormikContext } from 'formik';
import { RenderDateField, RenderRadioGroup } from '../fields';
import React, { useEffect } from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import { getTodayDate } from '../../utils';
import { Button } from '../../components/generic/Button';
import { ParticipantPostHireStatusSchema } from '../../constants/validation';
export const ManageGraduationForm = ({ initialValues, onClose, onSubmit }) => {
  return (
    <Box spacing={10} p={5}>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={ParticipantPostHireStatusSchema}
      >
        {({ submitForm, values }) => {
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
                  options={[
                    {
                      value: 'post_secondary_education_completed',
                      label: 'Graduated',
                    },
                    {
                      value: 'failed_cohort',
                      label: 'Failed',
                    },
                  ]}
                />
                {
                  <DependantDateForm
                    display={values.status === 'post_secondary_education_completed'}
                    test-id={'editGraduationModalStatus'}
                    name={'data.graduationDate'}
                    label={'Graduation Date'}
                  />
                }

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

const DependantDateForm = (props) => {
  const { values, setFieldValue } = useFormikContext();

  useEffect(() => {
    if (values.status === 'failed_cohort' && values?.data?.graduation_date) {
      setFieldValue(props.name, '');
    }
  }, [values, props.name, setFieldValue]);
  return (
    <>
      {props.display && (
        <Field
          test-id={props['test-id']}
          name={props.name}
          label={props.label}
          component={RenderDateField}
          maxDate={getTodayDate()}
        />
      )}
    </>
  );
};
