import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { Formik, Form as FormikForm } from 'formik';
import { useHistory } from 'react-router-dom';

import { FormSchema, Routes, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';
import { handleSubmission, scrollUp } from '../../utils';

import { Button } from '../generic';
import { Fields } from './Fields';
import { Footer } from './Footer';


export const Form = ({ initialValues, isDisabled }) => {
  const history = useHistory();

  const { openToast } = useToast();
  const [submitLoading, setSubmitLoading] = useState(false);

  const formValues = initialValues ? initialValues : {
    eligibility: true, //TODO HCAP-8 remove default, change to radio button
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
    postalCode: '',
    consent: true, //TODO HCAP-11 remove default, change to radio button
  };

  const handleSubmit = async (values) => {
    setSubmitLoading(true);

    const modifiedValues = handleSubmission(values);
    const response = await fetch('/api/v1/form', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-type': 'application/json' },
      body: JSON.stringify({ ...modifiedValues }),
    });

    if (response.ok) {
      const { id, error } = await response.json();
      if (error) {
        openToast({ status: ToastStatus.Error, message: error.message || 'Failed to submit this form' });
      } else {
        history.push(Routes.Confirmation, { formValues: values, id });
        scrollUp();
        return;
      }
    } else {
      openToast({ status: ToastStatus.Error, message: response.error || response.statusText || 'Server error' });
    }

    setSubmitLoading(false);
  };

  return (
    <Grid item xs={12} sm={isDisabled ? 12 : 11} md={isDisabled ? 12 : 10} lg={isDisabled ? 12 : 8} xl={isDisabled ? 12 : 6}>
      <Formik
        initialValues={formValues}
        validationSchema={FormSchema}
        onSubmit={handleSubmit}
      >
        {({ submitForm, setTouched, values }) => (
          <FormikForm>

            <Box pt={2} pb={4} pl={2} pr={2}>
              <Fields isDisabled={isDisabled} />
            </Box>

            {!isDisabled && (
              <Box display="flex" justifyContent="center" pl={2} pr={2}>
                <Button
                  onClick={() => submitForm()}
                  variant="contained"
                  color="primary"
                  fullWidth={false}
                  loading={submitLoading}
                  text="Submit"
                />
              </Box>)}

            <Box pt={4} pb={4} pl={2} pr={2}>
              <Footer />
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Grid>
  );
};