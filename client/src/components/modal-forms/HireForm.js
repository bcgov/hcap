import React from 'react';
import Grid from '@mui/material/Grid';
import { Button } from '../generic';
import { Box } from '@mui/material';
import { RenderDateField, RenderCheckbox, RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { getTodayDate } from '../../utils';

export const HireForm = ({ initialValues, validationSchema, onSubmit, onClose, sites }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm, values }) => (
        <FormikForm>
          <Box>
            <Field
              name='nonHcapOpportunity'
              component={RenderCheckbox}
              label='Non-HCAP Opportunity'
            />
            {values.nonHcapOpportunity && (
              <>
                <Field name='positionTitle' component={RenderTextField} label='* Position Title' />
                <Field
                  name='positionType'
                  component={RenderSelectField}
                  label='* Position Type'
                  options={[
                    { value: 'Full-Time', label: 'Full-Time' },
                    { value: 'Part-Time', label: 'Part-Time' },
                    { value: 'Casual', label: 'Casual' },
                  ]}
                />
              </>
            )}
            <Field
              name='hiredDate'
              component={RenderDateField}
              maxDate={getTodayDate()}
              label='* Date Hired'
            />
            <Field name='startDate' component={RenderDateField} label='* Start Date' />
            <Field
              name='site'
              component={RenderSelectField}
              label='* Site'
              options={sites.map((siteDetail) => ({
                value: siteDetail.siteId,
                label: siteDetail.siteName,
              }))}
            />
            <Field
              name='acknowledge'
              component={RenderCheckbox}
              label='I acknowledge that the participant has accepted the offer in writing.'
            />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justifyContent='flex-end'>
              <Grid item>
                <Button onClick={onClose} text='Cancel' />
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
