import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import MuiAlert from '@material-ui/lab/Alert';
import { Button } from '../generic';
import { Box, Typography } from '@material-ui/core';
import { RenderDateField, RenderRadioGroup, RenderCheckbox } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { ReturnOfServiceSchema, rosPositionType, rosEmploymentType } from '../../constants';
import { getTodayDate } from '../../utils';
import { createReturnOfServiceStatus } from '../../services';

// Helpers
const rosPositionTypeOptions = Object.values(rosPositionType);
const rosEmploymentTypeOptions = Object.values(rosEmploymentType);

// API caller
const postRoS = async ({ values, participantId, setError }) => {
  try {
    const { date, employmentType, positionType, sameSite } = values;
    await createReturnOfServiceStatus({
      participantId,
      data: {
        date,
        employmentType,
        positionType,
        sameSite,
      },
    });
    return true;
  } catch (error) {
    setError(error.message);
    return false;
  }
};

// Styles
const useStyles = makeStyles({
  bg: {
    backgroundColor: '#e8e8e8',
  },
});

// Post Cohort Assignment Form

export const ReturnOfServiceForm = ({
  initialValues = {
    date: '',
    positionType: '',
    employmentType: '',
    sameSite: true,
    confirm: '',
  },
  onClose,
  participantId,
  completionHandler,
}) => {
  // Style Classes
  const classes = useStyles();
  // Show Error
  const [error, setError] = useState(null);

  return (
    <Box spacing={2} p={0.2}>
      <Formik
        initialValues={initialValues}
        validationSchema={ReturnOfServiceSchema}
        onSubmit={async (values) => {
          const success = await postRoS({ values, participantId, setError });
          if (success) {
            onClose();
            completionHandler(true);
          }
        }}
      >
        {({ submitForm }) => (
          <FormikForm>
            <Typography color={'primary'} variant={'h4'}>
              {' '}
              Return of Service
            </Typography>
            <hr />
            <>{error !== null && <MuiAlert severity='error'>{error}</MuiAlert>}</>
            <br />
            <Box>
              <Field
                name='date'
                component={RenderDateField}
                label='Return of Service Start Date'
                maxDate={getTodayDate()}
                boldLabel={true}
              />
              <br />
              <Box className={classes.bg}>
                <Box p={1}>
                  <Field
                    name='positionType'
                    component={RenderRadioGroup}
                    label='Position Type'
                    options={rosPositionTypeOptions}
                    boldLabel={true}
                  />
                  <Field
                    name='employmentType'
                    component={RenderRadioGroup}
                    label='Specific position type (optional)'
                    options={rosEmploymentTypeOptions}
                    boldLabel={true}
                  />
                </Box>
              </Box>
              <br />
              <Field
                name='sameSite'
                component={RenderRadioGroup}
                label='Is this participant completing their RoS at their same site?'
                options={[
                  {
                    value: true,
                    label: 'Yes',
                  },
                  {
                    value: false,
                    label: 'No',
                  },
                ]}
                boldLabel={true}
              />
              <Box className={classes.bg}>
                <Box p={1}>
                  <Field
                    name='confirm'
                    component={RenderCheckbox}
                    label='I acknowledge that this participant has been registered as HCA.'
                  />
                </Box>
              </Box>
            </Box>
            <Box mt={3}>
              <Grid container spacing={2} justify='flex-end'>
                <Grid item>
                  <Button onClick={onClose} color='default' text='Cancel' />
                </Grid>
                <Grid item>
                  <Button onClick={submitForm} variant='contained' color='primary' text='Confirm' />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Box>
  );
};
