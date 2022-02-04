import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderDateField, RenderRadioGroup } from '../fields';
import React from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import { getTodayDate } from '../../utils';
import { Button } from '../../components/generic/Button';
export const ManageGraduationForm = ({ initialValues, onClose, submissionCallback }) => {
  // Graduated/failed radio buttons
  // Graduation date selection
  return (
    <Box spacing={10} p={5}>
      <Formik initialValues={initialValues}>
        {({ submitForm }) => (
          <FormikForm>
            <Box>
              <Typography color={'primary'} variant={'h4'}>
                {' '}
                Graduation Status
              </Typography>
              <hr />
              <Field
                test-id={'editGraduationModalStatus'}
                name='graduation_status'
                component={RenderRadioGroup}
                label='Has this participant graduated?'
                options={[
                  {
                    value: 'graduated',
                    label: 'Graduated',
                  },
                  {
                    value: 'failed',
                    label: 'Failed',
                  },
                ]}
              />
              <Field
                test-id={'editGraduationModalStatus'}
                name={'graduation_date'}
                label={'Gaduation Date'}
                component={RenderDateField}
                maxDate={getTodayDate()}
              />
              <Box mt={3}>
                <Grid container spacing={2} justify='flex-end'>
                  <Grid item>
                    <Button onClick={onClose} color='default' text='Cancel' />
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={() => {
                        submitForm();
                        submissionCallback();
                      }}
                      variant='contained'
                      color='primary'
                      text='Submit'
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Box>
  );
};
