import React, { Fragment, useState } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Stepper from '@material-ui/core/Stepper';
import MobileStepper from '@material-ui/core/MobileStepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import StepLabel from '@material-ui/core/StepLabel';
import Hidden from '@material-ui/core/Hidden';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { Formik, Form as FormikForm } from 'formik';
import { useHistory } from 'react-router-dom';

import { FormSchema, Routes, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';
import { handleSubmission, mapObjectProps, scrollUp } from '../../utils';

import { SectionOne } from './SectionOne';
import { SectionTwo } from './SectionTwo';
import { SectionThree } from './SectionThree';
import { SectionFour } from './SectionFour';
import { SectionFive } from './SectionFive';
import { SectionSix } from './SectionSix';
import { Card, Button } from '../generic';

const steps = [
  'Before You Begin',
  'Contact Information',
  'Before Workers Arrive',
  'After Workers Arrive',
  'If Workers Become ill',
  'Review',
];

function getStepFields(step) {
  switch (step) {
    case 0:
      return [
        'hasDownloadedBCMinistryAgricultureCovid19Requirements',
        'hasCompletedCovid19WorkplaceRiskAssessment',
        'hasCreatedCovid19InfectionPreventionAndControlProtocol',
      ];
    case 1:
      return [
        'registeredBusinessName',
        'firstName',
        'lastName',
        'phoneNumber',
        'alternatePhoneNumber',
        'emailAddress',
        'addressLine1',
        'addressLine2',
        'city',
        'province',
        'postalCode',
        'isSameAsBusinessAddress',
        'numberOfAdditionalAddresses',
        'temporaryForeignWorkerFacilityAddresses',
      ];
    case 2:
      return [
        'hasSignage',
        'hasSomeoneIdentified',
        'hasContactedLocalMedicalHealthOfficer',
        'doCommonAreasAllowPhysicalDistancing',
        'bedroomAccommodation',
        'areBedsInRightConfiguration',
        'doesUnderstandNeedsForSelfIsolation',
        'hasSeparateAccommodationForWorker',
        'hasLaundryServices',
        'hasDisposableGloves',
        'hasWasteRemovalSchedule',
        'hasSturdyLeakResistantGarbageBags',
        'hasHandWashingSinks',
        'hasAppropriateSupplyOfSinkWater',
        'hasPlainSoap',
        'hasPaperTowels',
        'hasHandWashingSigns',
        'hasSleepingArrangements',
        'hasPhysicalBarriers',
        'hasScheduleToEnsureTouchAreasAreCleaned',
      ];
    case 3:
      return [
        'hasMaterialsOnRiskOfExposure',
        'hasMaterialsOnHandWashingPhysicalDistancingCoughSneeze',
        'hasMaterialsOnHandWashingFacilities',
        'hasMaterialsReadyOnHowToSeekFirstAid',
        'hasMaterialsReadyOnHowToReportExposure',
        'hasSchedulesForKitchenEatingAreas',
        'doWorkersHaveOwnDishware',
        'isDishwareWashedImmediately',
      ];
    case 4:
      return [
        'hasFacilitiesToSeparateAndSelfIsolate',
        'isPreparedToProvideIndividualsExhibitingSymptoms',
        'isPreparedToDirectPersonToHealthLinkBC',
        'isPreparedToCleanAndDisinfectRooms',
        'isWillingToInformManagementAboutCommercialAccommodation',
        'isAbleToProvideFoodInSafeManner',
        'isAbleToPerformAdequateHousekeeping',
        'isAbleToPerformWasteManagement',
      ];
    case 5:
      return [
        'doesCertify',
        'doesAgree',
      ];

    default:
      return [];
  }
}

export const Form = ({ initialValues, isDisabled }) => {
  const history = useHistory();

  const { openToast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const formValues = initialValues ? initialValues : {

    // Section one
    hasDownloadedBCMinistryAgricultureCovid19Requirements: false,
    hasCompletedCovid19WorkplaceRiskAssessment: false,
    hasCreatedCovid19InfectionPreventionAndControlProtocol: false,

    // Section two
    registeredBusinessName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    emailAddress: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    isSameAsBusinessAddress: true,
    numberOfAdditionalAddresses: 1,
    temporaryForeignWorkerFacilityAddresses: [],

    // Section three
    hasSignage: false,
    hasSomeoneIdentified: false,
    hasContactedLocalMedicalHealthOfficer: false,
    doCommonAreasAllowPhysicalDistancing: false,
    bedroomAccommodation: null,
    areBedsInRightConfiguration: false,
    doesUnderstandNeedsForSelfIsolation: false,
    hasSeparateAccommodationForWorker: false,
    hasLaundryServices: false,
    hasDisposableGloves: false,
    hasWasteRemovalSchedule: false,
    hasSturdyLeakResistantGarbageBags: false,
    hasHandWashingSinks: false,
    hasAppropriateSupplyOfSinkWater: false,
    hasPlainSoap: false,
    hasPaperTowels: false,
    hasHandWashingSigns: false,
    hasSleepingArrangements: false,
    hasPhysicalBarriers: false,
    hasScheduleToEnsureTouchAreasAreCleaned: false,

    // Section four
    hasMaterialsOnRiskOfExposure: false,
    hasMaterialsOnHandWashingPhysicalDistancingCoughSneeze: false,
    hasMaterialsOnHandWashingFacilities: false,
    hasMaterialsReadyOnHowToSeekFirstAid: false,
    hasMaterialsReadyOnHowToReportExposure: false,
    hasSchedulesForKitchenEatingAreas: false,
    doWorkersHaveOwnDishware: false,
    isDishwareWashedImmediately: false,

    // Section five
    hasFacilitiesToSeparateAndSelfIsolate: false,
    isPreparedToProvideIndividualsExhibitingSymptoms: false,
    isPreparedToDirectPersonToHealthLinkBC: false,
    isPreparedToCleanAndDisinfectRooms: false,
    isWillingToInformManagementAboutCommercialAccommodation: false,
    isAbleToProvideFoodInSafeManner: false,
    isAbleToPerformAdequateHousekeeping: false,
    isAbleToPerformWasteManagement: false,

    // Section six
    doesCertify: false,
    doesAgree: false,
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

  const moveStepper = (index) => {
    setActiveStep(index);
  };

  const handleBackClicked = () => {
    moveStepper(activeStep - 1);
  };

  const handleNextClicked = async (submitForm, setTouched, values) => {
    if (isLastStep) {
      await submitForm();
    } else {
      const fieldsForCurrentStep = getStepFields(activeStep);
      const filtered = Object.keys(values)
        .filter((k) => fieldsForCurrentStep.includes(k))
        .reduce((a, v) => ({ ...a, [v]: values[v] }), {});
      const fieldsToTouch = mapObjectProps(filtered, () => true);
      const errors = await setTouched(fieldsToTouch);
      const hasOutstandingErrors = Object.keys(errors).some((key) => fieldsForCurrentStep.includes(key));
      if (!hasOutstandingErrors) {
        scrollUp();
        moveStepper(activeStep + 1);
      }
    }
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

            {!isDisabled && (
              <Box pt={4} pb={1} pl={2} pr={2}>
                <Card noPadding>

                  {/** Desktop Stepper */}
                  <Hidden xsDown>
                    <Stepper
                      alternativeLabel
                      activeStep={activeStep}
                    >
                      {steps.map((label, index) => (
                        <Step key={label}>
                          <StepButton onClick={() => moveStepper(index)}>
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
                  {activeStep === 0 && <SectionOne isDisabled={isDisabled} />}
                  {activeStep === 1 && <SectionTwo isDisabled={isDisabled} />}
                  {activeStep === 2 && <SectionThree isDisabled={isDisabled} />}
                  {activeStep === 3 && <SectionFour isDisabled={isDisabled} />}
                  {activeStep === 4 && <SectionFive isDisabled={isDisabled} />}
                  {activeStep === 5 && <SectionSix handleEditClick={moveStepper} />}
                </Fragment>
              ) : (
                <SectionSix isDisabled />
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
                            onClick={handleBackClicked}
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
