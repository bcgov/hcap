import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderTextField, RenderSelectField, RenderRadioGroup } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import Typography from '@material-ui/core/Typography';

export const NewSiteForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm, values }) => (
        <FormikForm>
          <Box>
            <Box pt={2} pb={1}>
              <Typography variant='body1'>
                <b>Site Key Details</b>
              </Typography>
            </Box>
            <Field name='siteId' component={RenderTextField} label='* Site ID' />
            <Field name='siteName' component={RenderTextField} label='* Site Name' />
            <Field name='postalCode' component={RenderTextField} label='* Postal Code' />
            <Field
              name='healthAuthority'
              component={RenderSelectField}
              label='* Health Authority'
              options={[
                { value: 'Interior', label: 'Interior Health' },
                { value: 'Fraser', label: 'Fraser Health' },
                { value: 'Vancouver Coastal', label: 'Vancouver Coastal Health' },
                { value: 'Vancouver Island', label: 'Vancouver Island Health' },
                { value: 'Northern', label: 'Northern Health' },
              ]}
            />
            <Field name='allocation' type='number' component={RenderTextField} label='Allocation' />
            <Box pt={2} pb={1}>
              <Typography variant='body1'>
                <b>Additional Site Info</b>
              </Typography>
            </Box>
            <Field
              name='registeredBusinessName'
              component={RenderTextField}
              label='Business Name'
            />
            <Field name='address' component={RenderTextField} label='Street Address' />
            <Field name='city' component={RenderTextField} label='City' />
            <Field
              name='isRHO'
              component={RenderRadioGroup}
              label='Is this site a Regional Health Office?'
              options={[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ]}
            />
            <Box pt={2} pb={1}>
              <Typography variant='body1'>
                <b>Operator Info</b>
              </Typography>
            </Box>
            <Field name='operatorName' component={RenderTextField} label='Operator Name' />
            <Field
              name='operatorContactFirstName'
              component={RenderTextField}
              label='Contact First Name'
            />
            <Field
              name='operatorContactLastName'
              component={RenderTextField}
              label='Contact Last Name'
            />
            <Field name='operatorPhone' component={RenderTextField} label='Phone Number' />
            <Field name='operatorEmail' component={RenderTextField} label='Email address' />
            <Box pt={1} pb={1}>
              <Typography variant='body1'>
                <b>Site Contact</b>
              </Typography>
            </Box>
            <Field name='siteContactFirstName' component={RenderTextField} label='First Name' />
            <Field name='siteContactLastName' component={RenderTextField} label='Last Name' />
            <Field name='siteContactPhone' component={RenderTextField} label='Phone Number' />
            <Field name='siteContactEmail' component={RenderTextField} label='Email Address' />
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
