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
import {
  getTodayDate,
  formatOptions,
  checkForFieldResets,
  showRoleInvolvesMentalHealthOrSubstanceUse,
  isOtherSelected,
} from '../../utils';
import { RenderAutocomplete } from '../fields/RenderAutocomplete';
import {
  API_URL,
  ToastStatus,
  ExternalHiredParticipantSchema,
  YesNoDontKnow,
  YesNo,
  YesNoPreferNot,
  reasonForFindingOutOptions,
  currentOrMostRecentIndustryOptions,
  regionLabelsMap,
} from '../../constants';
import { useToast } from '../../hooks';
import { useAuth } from '../../providers/AuthContext';

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
  preferredLocation: '',
  reasonForFindingOut: [],
  currentOrMostRecentIndustry: '',
  roleInvolvesMentalHealthOrSubstanceUse: '',
  otherIndustry: '',
  eligibility: '',
};

export const NewParticipantForm = ({ submissionCallback, onClose, sites }) => {
  const { auth } = useAuth();

  const { openToast } = useToast();

  // filter only regions contained in users role
  const haOptions = auth?.user.roles
    .map((r) => ({ value: regionLabelsMap[r], label: regionLabelsMap[r] }))
    .filter(({ label }) => label);

  const handleExternalHire = async (participantInfo) => {
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
      {({ submitForm, values, setFieldValue, handleChange, setFieldTouched, touched, isValid }) => (
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
                  setFieldValue
                );
                handleChange(e);
              }}
            />
            <Field
              name='eligibility'
              component={RenderSelectField}
              label='* Are they a Canadian citizen or permanent resident?'
              options={YesNo}
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
              component={RenderSelectField}
              label='* Please select their preferred health region(s)'
              options={haOptions || []}
            />
            <Field
              name='reasonForFindingOut'
              component={RenderMultiSelectField}
              label='* How did they learn about HCAP?'
              options={formatOptions(reasonForFindingOutOptions)}
            />
            <Field
              name='currentOrMostRecentIndustry'
              component={RenderSelectField}
              label='What industry do they currently or most recently work in? Please select the most applicable option.'
              options={formatOptions(currentOrMostRecentIndustryOptions)}
              onChange={(e) => {
                // check for valid selections to prevent conditional values being sent back when conditions aren't truthy
                const selectedValue = e.target.value;
                // reset the value of otherIndustry if user changes currentOrMostRecentIndustry selection from Other
                checkForFieldResets(
                  e.target.value,
                  'otherIndustry',
                  'Other, please specify:',
                  setFieldValue,
                  setFieldTouched
                );
                // reset the value of roleInvolvesMentalHealthOrSubstanceUse if user changes currentOrMostRecentIndustry selection
                // from a valid selection to show this question
                if (
                  !showRoleInvolvesMentalHealthOrSubstanceUse(
                    values.program === 'MHAW',
                    selectedValue
                  )
                ) {
                  setFieldValue('roleInvolvesMentalHealthOrSubstanceUse', '');
                  setFieldTouched('roleInvolvesMentalHealthOrSubstanceUse', false);
                }
                handleChange(e);
              }}
            />
            {isOtherSelected(values.currentOrMostRecentIndustry) && (
              <Field name='otherIndustry' component={RenderTextField} />
            )}
            {showRoleInvolvesMentalHealthOrSubstanceUse(
              values.program === 'MHAW',
              values.currentOrMostRecentIndustry
            ) && (
              <Field
                name='roleInvolvesMentalHealthOrSubstanceUse'
                component={RenderSelectField}
                label='Does/did this role involve delivering mental health and/or substance use
                  services?'
                options={YesNo}
              />
            )}
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
                checkForFieldResets(e.target.value, 'otherOrigin', 'origin', setFieldValue);
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
                  onClick={submitForm}
                  disabled={touched.eligibility && values.eligibility === 'No'}
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
