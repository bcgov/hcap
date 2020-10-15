import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import mapValues from 'lodash/mapValues';
import { Formik, Form as FormikForm } from 'formik';
import { useHistory } from 'react-router-dom';

import { EmployerFormSchema, Routes, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';
import { scrollUp } from '../../utils';
import { Card, Button } from '../generic';
import { Summary } from './Summary';
import { OperatorInfo } from './OperatorInfo';
import { SiteInfo } from './SiteInfo';
import { HcapRequest } from './HcapRequest';
import { WorkforceBaseline } from './WorkforceBaseline';

export const Form = ({ initialValues, isDisabled }) => {
  const history = useHistory();
  const { openToast } = useToast();
  const [submitLoading, setSubmitLoading] = useState(false);

  const formValues = initialValues ? initialValues : {
    // Operator info
    registeredBusinessName: '',
    operatorFirstName: '',
    operatorLastName: '',
    operatorContactFirstName: '',
    operatorContactLastName: '',
    operatorEmail: '',
    operatorPhone: '',

    // Site info
    siteName: '',
    address: '',
    postalCode: '',
    geographicRegion: '',
    siteType: '',
    otherSite: '',
    numPublicLongTermCare: '',
    numPrivateLongTermCare: '',
    numPublicAssistedLiving: '',
    numPrivateAssistedLiving: '',
    comment: '',
    siteContactFirstName: '',
    siteContactLastName: '',
    phoneNumber: '',
    emailAddress: '',

    // Site HCAP request
    hcswFteNumber: '',

    // Workforce Baseline
    workforceBaseline: {},
  };

  const mapBaselineList = (values) => {
    let newWorkforceBaseline = [];

    mapValues(values.workforceBaseline, (value, key) => {
      if (value.add) {
        newWorkforceBaseline.push({
          role: key,
          currentFullTime: value.currentFullTime,
          currentPartTime: value.currentPartTime,
          currentCasual: value.currentCasual,
          vacancyFullTime: value.vacancyFullTime,
          vacancyPartTime: value.vacancyPartTime,
          vacancyCasual: value.vacancyCasual,
        })
      }
    });

    return { ...values, workforceBaseline: newWorkforceBaseline }
  }

  const handleSubmit = async (values) => {
    setSubmitLoading(true);

    const response = await fetch('/api/v1/employer-form', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-type': 'application/json' },
      body: JSON.stringify(mapBaselineList(values)),
    });

    if (response.ok) {
      const { error } = await response.json();
      if (error) {
        openToast({ status: ToastStatus.Error, message: error.message || 'Failed to submit this form' });
      } else {
        history.push(Routes.EmployerConfirmation, { formValues: values });
        return;
      }
    } else {
      openToast({ status: ToastStatus.Error, message: response.error || response.statusText || 'Server error' });
    }

    setSubmitLoading(false);
  };

  const handleSubmitButton = (submitForm) => {
    scrollUp();
    submitForm();
  };

  return (
    <Grid item xs={12} sm={isDisabled ? 12 : 11} md={isDisabled ? 12 : 10} lg={isDisabled ? 12 : 8} xl={isDisabled ? 12 : 6}>
      <Formik
        initialValues={formValues}
        validationSchema={EmployerFormSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, submitForm, setTouched, values }) => (
          <FormikForm>
            <Box pt={4} pb={1} pl={2} pr={2}>
              <Card>
                <Box pt={0} pb={0} pl={2} pr={2}>
                  <Summary isDisabled={isDisabled} />
                </Box>

                <Box pt={2} pb={2} pl={2} pr={2}>
                  <OperatorInfo isDisabled={isDisabled} />
                </Box>

                <Box pt={2} pb={2} pl={2} pr={2}>
                  <SiteInfo isDisabled={isDisabled} />
                </Box>

                <Box pt={2} pb={2} pl={2} pr={2}>
                  <HcapRequest isDisabled={isDisabled} />
                </Box>

                <Box pt={2} pb={4} pl={2} pr={2}>
                  <WorkforceBaseline isDisabled={isDisabled} />
                </Box>
              </Card>
            </Box>

            {!isDisabled && (
              <Box display="flex" justifyContent="center" pt={0} pb={4} pl={2} pr={2}>
                <Button
                  onClick={() => handleSubmitButton(submitForm)}
                  variant="contained"
                  color="primary"
                  fullWidth={false}
                  loading={submitLoading}
                  text="Submit"
                />
              </Box>)}
          </FormikForm>
        )}
      </Formik>
    </Grid>
  );
};
