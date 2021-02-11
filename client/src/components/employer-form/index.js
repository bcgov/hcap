import React, { Fragment, useState } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import mapValues from 'lodash/mapValues';
import { Formik, Form as FormikForm } from 'formik';
import { useHistory } from 'react-router-dom';
import Stepper from '@material-ui/core/Stepper';
import MobileStepper from '@material-ui/core/MobileStepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import StepLabel from '@material-ui/core/StepLabel';
import Hidden from '@material-ui/core/Hidden';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import Typography from '@material-ui/core/Typography';

import { EmployerFormSchema, Routes, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';
import { scrollUp, mapObjectProps } from '../../utils';
import { Card, Button } from '../generic';
import { BeforeYouBegin } from './BeforeYouBegin';
import { OperatorInfo } from './OperatorInfo';
import { SiteInfo } from './SiteInfo';
import { ExpressionOfInt } from './ExpressionOfInt';
import { WorkforceBaseline } from './WorkforceBaseline';
import { Review } from './Review';

const steps = [
  'Before You Begin',
  'Operator Contact Information',
  'Site Information',
  'Site Workforce Baseline',
  'Expression of Interest',
  'Review',
];

const getStepFields = (step) => {
  switch (step) {
    case 1:
      return [
        'registeredBusinessName',
        'operatorName',
        'operatorContactFirstName',
        'operatorContactLastName',
        'operatorEmail',
        'operatorPhone',
        'operatorAddress',
        'operatorPostalCode',
      ];
    case 2:
      return [
        'siteName',
        'address',
        'healthAuthority',
        'siteContactFirstName',
        'siteContactLastName',
        'phoneNumber',
        'emailAddress',
        'siteType',
        'otherSite',
        'numPublicLongTermCare',
        'numPrivateLongTermCare',
        'numPublicAssistedLiving',
        'numPrivateAssistedLiving',
      ];
    case 3:
      return [
        'workforceBaseline',
      ];
    case 4:
      return [
        'hcswFteNumber',
        'staffingChallenges',
      ];
    default:
      return [];
  }
}

export const Form = ({ hideCollectionNotice, initialValues, isDisabled }) => {
  const defaultValues = {
    // Operator contact info
    registeredBusinessName: '',
    operatorName: '', 
    operatorContactFirstName: '',
    operatorContactLastName: '',
    operatorEmail: '',
    operatorPhone: '',
    operatorAddress: '',
    operatorPostalCode: '',

    // Site contact info
    siteName: '',
    address: '',
    healthAuthority: '',
    siteContactFirstName: '',
    siteContactLastName: '',
    phoneNumber: '',
    emailAddress: '',
    siteType: '',
    otherSite: '',
    numPublicLongTermCare: '',
    numPrivateLongTermCare: '',
    numPublicAssistedLiving: '',
    numPrivateAssistedLiving: '',

    // Workforce Baseline
    workforceBaseline: {
      'Registered Nurse': {},
      'Licensed Practical Nurse': {},
      'Health Care Assistant': {},
      'Food Services Worker': {},
      'Housekeeping': {},
      'COVID-19 IPC Response': {},
      'Site Administrative Staff': {},
    },

    // Site HCAP request
    hcswFteNumber: '',
    staffingChallenges: '',

    // Collection certification
    doesCertify: false,
  };
  const history = useHistory();
  const { openToast } = useToast();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formValues, setFormValues] = useState(defaultValues);

  const [activeStep, setActiveStep] = useState(0);
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;
  
  if (initialValues && formValues !== initialValues) {
    setFormValues(initialValues);
  };

  const mapBaselineList = (values) => {
    let newWorkforceBaseline = [];

    mapValues(values.workforceBaseline, (value, key) => {
      newWorkforceBaseline.push({
        role: key,
        currentFullTime: value.currentFullTime,
        currentPartTime: value.currentPartTime,
        currentCasual: value.currentCasual,
        vacancyFullTime: value.vacancyFullTime,
        vacancyPartTime: value.vacancyPartTime,
        vacancyCasual: value.vacancyCasual,
      })
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

  const moveStepper = async (index, setTouched, values) => {
    const fieldsForCurrentStep = getStepFields(activeStep);
    const filtered = Object.keys(values)
      .filter((k) => fieldsForCurrentStep.includes(k))
      .reduce((a, v) => ({ ...a, [v]: values[v] }), {});
    const fieldsToTouch = mapObjectProps(filtered, () => true);
    const errors = await setTouched(fieldsToTouch);
    const hasOutstandingErrors = Object.keys(errors).some((key) => fieldsForCurrentStep.includes(key));
    if (!hasOutstandingErrors) {
      setActiveStep(index);
      scrollUp();
    }
  };

  const handleEditClicked = (index) => {
    setActiveStep(index);
    scrollUp();
  }

  const handleBackClicked = (setTouched, values) => {
    moveStepper(activeStep - 1, setTouched, values);
  };

  const handleNextClicked = async (submitForm, setTouched, values) => {
    if (isLastStep) {
      await submitForm();
    } else {
      moveStepper(activeStep + 1, setTouched, values);
    }
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
            {!isDisabled && (
              <Box pt={4} pb={1} pl={2} pr={2}>
                <Card noPadding>

                  {/** Desktop Stepper */}
                  <Hidden xsDown>
                    <Stepper
                      nonLinear
                      alternativeLabel
                      activeStep={activeStep}
                    >
                      {steps.map((label, index) => (
                        <Step key={label}>
                          <StepButton onClick={() => moveStepper(index, setTouched, values)}>
                            <StepLabel>{label}</StepLabel>
                          </StepButton>
                        </Step>
                      ))}
                    </Stepper>
                  </Hidden>

                  {/** Mobile Stepper - Text */}
                  <Hidden smUp>
                    <Box p={2}>
                      <Typography variant="body1" color="primary" gutterBottom>
                        Step {activeStep + 1} of {steps.length}
                      </Typography>
                      <Typography variant="body1">
                        <b>{activeStep + 1}. {steps[activeStep]}</b>
                      </Typography>
                    </Box>
                  </Hidden>
                </Card>
              </Box>
            )}

            <Box pt={2} pb={4} pl={2} pr={2}>

              {/** Form Sections */}
              {!isDisabled ? (
                <Fragment>
                  {activeStep === 0 && <BeforeYouBegin />}
                  {activeStep === 1 && <OperatorInfo isDisabled={isDisabled} />}
                  {activeStep === 2 && <SiteInfo isDisabled={isDisabled} />}
                  {activeStep === 3 && <WorkforceBaseline isDisabled={isDisabled} />}
                  {activeStep === 4 && <ExpressionOfInt isDisabled={isDisabled} />}
                  {activeStep === 5 && <Review handleEditClick={handleEditClicked} />}
                </Fragment>
              ) : (
                  <Review hideCollectionNotice={hideCollectionNotice} isDisabled />
                )}

              {/** Desktop Prev / Next */}
              {!isDisabled && (
                <Hidden xsDown>
                  <Box mt={3}>
                    <Grid container spacing={2}>
                      {activeStep > 0 && (
                        <Grid item>
                          <Button
                            disabled={isFirstStep}
                            onClick={() => handleBackClicked(setTouched, values)}
                            text="Back"
                            fullWidth={false}
                          />
                        </Grid>
                      )}
                      <Grid item>
                        <Button
                          onClick={() => handleNextClicked(submitForm, setTouched, values)}
                          variant="contained"
                          color="primary"
                          fullWidth={false}
                          loading={submitLoading}
                          text={isLastStep ? 'Submit' : 'Next'}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Hidden>
              )}
            </Box>

            {/** Mobile Stepper - Prev / Next */}
            {!isDisabled && (
              <Hidden smUp>
                <Box pb={4} pl={2} pr={2}>
                  <Card noPadding>
                    <MobileStepper
                      style={{ backgroundColor: '#FFFFFF' }}
                      steps={steps.length}
                      variant="text"
                      position="static"
                      activeStep={activeStep}
                      backButton={(
                        <Button
                          fullWidth={false}
                          disabled={isFirstStep}
                          onClick={handleBackClicked}
                          text={(
                            <Fragment>
                              <KeyboardArrowLeft /> Back
                            </Fragment>
                          )}
                        />
                      )}
                      nextButton={(
                        <Button
                          fullWidth={false}
                          loading={submitLoading}
                          onClick={() => handleNextClicked(submitForm, setTouched, values)}
                          text={isLastStep ? 'Submit' : (
                            <Fragment>
                              Next <KeyboardArrowRight />
                            </Fragment>
                          )}
                        />
                      )}
                    />
                  </Card>
                </Box>
              </Hidden>
            )}
          </FormikForm>
        )}
      </Formik>
    </Grid>
  );
};
