import React from 'react';
import store from 'store';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderDateField, RenderCheckbox, RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { getTodayDate } from '../../utils';
import { RenderAutocomplete } from '../fields/RenderAutocomplete';
import { API_URL, ExternalHiredParticipantSchema, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';

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
  driversLicense: '',
  indigenous: '',
  educationalRequirements: '',
  currentOrMostRecentIndustry: '',
  roleInvolvesMentalHealthOrSubstanceUse: '',
  experienceWithMentalHealthOrSubstanceUse: '',
};

export const NewParticipantForm = ({ submissionCallback, onClose, sites }) => {
  const { openToast } = useToast();

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
      {({ submitForm, values }) => (
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
                { value: 'hca', label: 'HCA' },
                { value: 'mhaw', label: 'MHAW' },
              ]}
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
            <Field
              name='origin'
              component={RenderSelectField}
              label='* Origin of Offer'
              options={[
                { value: 'internal', label: 'Internal' },
                { value: 'other', label: 'Other' },
              ]}
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
              name='driversLicense'
              component={RenderSelectField}
              label='* Class 5 Drivers License'
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' },
              ]}
            />
            <Field
              name='indigenous'
              component={RenderSelectField}
              label='Self-identifies as First Nation, Métis, Inuk (Inuit) or Urban Indigenous?'
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'preferNotTOSay', label: 'Prefer not to say' },
              ]}
            />
            <Field
              name='educationalRequirements'
              component={RenderSelectField}
              label='Meets educational requirements'
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'dontknow', label: 'Does not know' },
              ]}
            />
            <Field
              name='currentOrMostRecentIndustry'
              component={RenderTextField}
              label='What industry did they most recently work in?'
            />
            <Field
              name='roleInvolvesMentalHealthOrSubstanceUse'
              component={RenderSelectField}
              label='Did their last role involve Mental Health or Substance Use?'
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' },
              ]}
            />
            <Field
              name='experienceWithMentalHealthOrSubstanceUse'
              component={RenderSelectField}
              label='Do they have lived or living experience with Mental Health or Substance Use?'
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'preferNotTOSay', label: 'Prefer not to say' },
                { value: 'unknown', label: 'Unknown' },
              ]}
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
                <Button onClick={submitForm} variant='contained' color='primary' text='Submit' />
              </Grid>
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
