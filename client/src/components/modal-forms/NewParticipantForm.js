import React from 'react';
import store from 'store';
import { Field, Formik, Form as FormikForm } from 'formik';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import {
  RenderDateField,
  RenderCheckbox,
  RenderTextField,
  RenderSelectField,
  RenderMultiSelectField,
} from '../fields';
import { getTodayDate, formatOptions, checkForFieldResets } from '../../utils';
import { RenderAutocomplete } from '../fields/RenderAutocomplete';
import {
  API_URL,
  ToastStatus,
  ExternalHiredParticipantSchema,
  YesNoDontKnow,
  YesNo,
  YesNoPreferNot,
  healthAuthorityOptions,
  reasonForFindingOutOptions,
} from '../../constants';
import { useToast } from '../../hooks';
import { BackgroundInformationForm } from './BackgroundInformationForm';

const newParticipantInitialValues = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  emailAddress: '',
  origin: '',
  otherOrigin: '',
  hcapOpportunity: true,
  contactedDate: '',
  hiredDate: '',
  startDate: '',
  site: '',
  acknowledge: false,
  program: '',
  educationalRequirements: '',
  postalCode: '',
  driverLicense: '',
  indigenous: '',
  experienceWithMentalHealthOrSubstanceUse: '',
  preferredLocation: [],
  reasonForFindingOut: [],
  currentOrMostRecentIndustry: '',
  roleInvolvesMentalHealthOrSubstanceUse: '',
  otherIndustry: '',
};

export const NewParticipantForm = ({ submissionCallback, onClose, sites }) => {
  const { openToast } = useToast();

  const handleExternalHire = async (participantInfo) => {
    // remove otherIndustry from being sent back
    // it gets set to currentOrMostRecentIndustry on submit if a value exists
    // keeps question to a single value
    delete participantInfo.otherIndustry;

    const response = await fetch(`${API_URL}/api/v1/new-hired-participant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(participantInfo),
    });

    if (response.ok) {
      onClose();
      submissionCallback();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };
  return (
    <Formik
      initialValues={newParticipantInitialValues}
      onSubmit={handleExternalHire}
      validationSchema={ExternalHiredParticipantSchema}
    >
      {({ submitForm, values, isValid, setFieldValue, handleChange, setTouched }) => (
        <FormikForm>
          <Box>
            <Field
              name='hcapOpportunity'
              component={RenderCheckbox}
              label='HCAP Opportunity'
              checked
              disabled
            />
            <Field
              name='program'
              component={RenderSelectField}
              label='* Pathway'
              options={[
                { value: 'HCA', label: 'HCA' },
                { value: 'MHAW', label: 'MHAW' },
              ]}
              onChange={(e) => {
                // reset the value of experienceWithMentalHealthOrSubstanceUse if user changes program selection
                checkForFieldResets(
                  e.target.value,
                  'experienceWithMentalHealthOrSubstanceUse',
                  'MHAW',
                  setFieldValue,
                  setTouched
                );
                handleChange(e);
              }}
            />
            <Field
              name='educationalRequirements'
              component={RenderSelectField}
              label='* Do they meet the educational requirements for the program?'
              options={YesNoDontKnow}
            />
            <Field name='firstName' component={RenderTextField} label='* First Name' />
            <Field name='lastName' component={RenderTextField} label='* Last Name' />
            <Field
              name='phoneNumber'
              component={RenderTextField}
              label='* Phone Number'
              type='tel'
            />
            <Field
              name='emailAddress'
              component={RenderTextField}
              label='* Email Address'
              type='email'
            />
            <Field name='postalCode' component={RenderTextField} label='* Postal Code' />
            <Field
              name='driverLicense'
              component={RenderSelectField}
              label='* Do they have a valid Class 5 BC Drivers Licence?'
              options={YesNo}
            />
            <Field
              name='indigenous'
              component={RenderSelectField}
              label='Do they self-identify as First Nation, Métis, Inuk (Inuit) or Urban Indigenous?'
              options={YesNoPreferNot}
            />
            {values.program === 'MHAW' && (
              <Field
                name='experienceWithMentalHealthOrSubstanceUse'
                component={RenderSelectField}
                label='Do they have lived or living experience of mental health and/or substance use
              challenges?'
                options={YesNoPreferNot}
              />
            )}
            <Field
              name='preferredLocation'
              component={RenderMultiSelectField}
              label='* Please select their preferred health region(s)'
              options={healthAuthorityOptions}
            />
            <Field
              name='reasonForFindingOut'
              component={RenderMultiSelectField}
              label='* How did they learn about HCAP?'
              options={formatOptions(reasonForFindingOutOptions)}
            />
            <BackgroundInformationForm
              isMHAWProgram={values.program === 'MHAW'}
              selectedOption={values.currentOrMostRecentIndustry}
            />
            <Field
              name='origin'
              component={RenderSelectField}
              label='* Origin of Offer'
              options={[
                { value: 'internal', label: 'Internal' },
                { value: 'other', label: 'Other' },
              ]}
              onChange={(e) => {
                // reset the value of otherOrigin if user changes origin selection from other to internal
                checkForFieldResets(
                  e.target.value,
                  'otherOrigin',
                  'origin',
                  setFieldValue,
                  setTouched
                );
                handleChange(e);
              }}
            />
            {values.origin === 'other' && (
              <Field
                name='otherOrigin'
                component={RenderTextField}
                label='* Where did the offer originate?'
              />
            )}
            <Field
              name='contactedDate'
              component={RenderDateField}
              maxDate={getTodayDate()}
              label='* Date Contacted'
            />
            <Field
              name='hiredDate'
              component={RenderDateField}
              maxDate={getTodayDate()}
              label='* Date Offer Accepted'
            />
            <Field name='startDate' component={RenderDateField} label='* Start Date' />
            <Field
              name='site'
              component={RenderAutocomplete}
              label='* Site'
              options={sites
                .map((siteDetail) => ({
                  value: siteDetail.siteId,
                  label: siteDetail.siteName,
                }))
                .sort((a, b) => a.label.localeCompare(b.label))}
            />
            <Field
              name='acknowledge'
              component={RenderCheckbox}
              label='I acknowledge that the participant has accepted the offer in writing.'
            />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justify='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                <Button
                  onClick={() => {
                    if (isValid && values.otherIndustry !== '') {
                      setFieldValue('currentOrMostRecentIndustry', values.otherIndustry);
                    }
                    submitForm();
                  }}
                  variant='contained'
                  color='primary'
                  text='Submit'
                />
              </Grid>
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
