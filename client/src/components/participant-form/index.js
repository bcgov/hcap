import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Formik, Form as FormikForm } from 'formik';
import { useNavigate } from 'react-router-dom';

import {
  API_URL,
  ParticipantFormSchema,
  ParticipantEditFormSchema,
  Routes,
  ToastStatus,
} from '../../constants';
import { useToast } from '../../hooks';
import { scrollUp } from '../../utils';

import { Button } from '../generic';
import { Summary } from './Summary';
import { Fields } from './Fields';
import { isNonPortalHire } from '../../utils/isNonPortalHire';

export const Form = ({
  initialValues,
  isDisabled,
  hideSummary,
  onSubmit,
  enableFields,
  editMode,
  isSubmitted,
}) => {
  const navigate = useNavigate();
  const { openToast } = useToast();
  const [submitLoading, setSubmitLoading] = useState(false);

  const formValues = initialValues
    ? initialValues
    : {
        program: '',
        eligibility: '',
        educationalRequirements: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        emailAddress: '',
        postalCode: '',
        indigenous: '',
        preferredLocation: [],
        driverLicense: '',
        experienceWithMentalHealthOrSubstanceUse: '',
        interestedWorkingPeerSupportRole: '',
        consent: '',
        reasonForFindingOut: [],
        currentOrMostRecentIndustry: '',
        roleInvolvesMentalHealthOrSubstanceUse: '',
        otherIndustry: '',
      };

  const handleSubmit = async (values) => {
    delete values.otherIndustry;

    if (onSubmit) {
      onSubmit(values);
      return;
    }
    setSubmitLoading(true);
    const response = await fetch(`${API_URL}/api/v1/participants`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (response.ok) {
      const { id } = await response.json();
      navigate(Routes.ParticipantConfirmation, { state: { formValues: values, id } });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }

    setSubmitLoading(false);
  };

  const handleSubmitButton = (submitForm) => {
    scrollUp();
    submitForm();
  };

  return (
    <Grid item xs={12}>
      <Formik
        initialValues={formValues}
        validationSchema={editMode ? ParticipantEditFormSchema : ParticipantFormSchema}
        onSubmit={handleSubmit}
      >
        {({ submitForm, values, setFieldValue, isValid }) => (
          <FormikForm>
            <Box hidden={hideSummary} pt={4} pb={2} pl={2} pr={2}>
              <Summary />
            </Box>

            <Box pt={2} pb={4} pl={2} pr={2}>
              <Fields
                values={values}
                isDisabled={isDisabled}
                hideHelp={hideSummary}
                enableFields={enableFields}
                isNonPortalHire={isNonPortalHire(initialValues)}
                isSubmitted={isSubmitted}
              />
            </Box>
            {!isDisabled && (
              <Box display='flex' justifyContent='center' pt={0} pb={4} pl={2} pr={2}>
                <Button
                  onClick={() => {
                    if (isValid && values.otherIndustry !== '') {
                      setFieldValue('currentOrMostRecentIndustry', values.otherIndustry);
                    }
                    handleSubmitButton(submitForm);
                  }}
                  variant='contained'
                  color='primary'
                  fullWidth={false}
                  loading={submitLoading}
                  text='Submit'
                  // only disable on screen out message (Q2)
                  disabled={values.eligibility === false}
                />
              </Box>
            )}
          </FormikForm>
        )}
      </Formik>
    </Grid>
  );
};
