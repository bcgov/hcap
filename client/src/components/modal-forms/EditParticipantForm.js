import React from 'react';
import store from 'store';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { API_URL, EditParticipantFormSchema } from '../../constants';

export const EditParticipantForm = ({ initialValues, onClose, submissionCallback }) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={EditParticipantFormSchema}
      onSubmit={async (values) => {
        // TODO: [HCAP-852](https://freshworks.atlassian.net/browse/HCAP-852)
        if (values.phoneNumber && Number.isInteger(values.phoneNumber))
          values.phoneNumber = values.phoneNumber.toString();
        if (values.postalCode && values.postalCode.length > 3) {
          values.postalCodeFsa = values.postalCode.slice(0, 3);
        }
        const history = {
          timestamp: new Date(),
          changes: [],
        };
        Object.keys(values).forEach((key) => {
          if (values[key] !== initialValues[key]) {
            history.changes.push({
              field: key,
              from: initialValues[key],
              to: values[key],
            });
          }
        });
        values.history = initialValues.history ? [history, ...initialValues.history] : [history];
        const response = await fetch(`${API_URL}/api/v1/participant`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${store.get('TOKEN')}`,
            Accept: 'application/json',
            'Content-type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          if (submissionCallback) {
            submissionCallback();
          }
          onClose();
        }
      }}
    >
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            <Field
              test-id={'editParticipantFirstName'}
              name='firstName'
              component={RenderTextField}
              label='First Name'
            />
            <Field
              test-id={'editParticipantLastName'}
              name='lastName'
              component={RenderTextField}
              label='Last Name'
            />
            <Field
              test-id={'editParticipantPhone'}
              name='phoneNumber'
              component={RenderTextField}
              label='* Phone Number'
              type='tel'
            />
            <Field
              test-id={'editParticipantEmail'}
              name='emailAddress'
              component={RenderTextField}
              label='* Email Address'
              type='email'
            />
            <Field
              test-id={'editParticipantEmail'}
              name='postalCode'
              component={RenderTextField}
              label='* Postal Code'
              type='text'
            />
            <Field
              test-id={'editParticipantInterested'}
              name='interested'
              component={RenderSelectField}
              label='Program Interest'
              options={[
                { value: 'yes', label: 'Interested' },
                { value: 'withdrawn', label: 'Withdrawn' },
              ]}
            />
          </Box>
          <Box my={2}>
            <Grid container spacing={2} justify='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                <Button
                  test-id={'editParticipantSave'}
                  onClick={submitForm}
                  variant='contained'
                  color='primary'
                  text='Save'
                />
              </Grid>
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
