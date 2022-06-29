import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { CreatePSISchema } from '../../constants';
import { createPSI, updatePSI } from '../../services';

const PSI_INITIAL_VALUES = {
  instituteName: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  healthAuthority: '',
};

const HEALTH_AUTHORITIES = [
  { value: 'Interior', label: 'Interior Health' },
  { value: 'Fraser', label: 'Fraser Health' },
  { value: 'Vancouver Coastal', label: 'Vancouver Coastal Health' },
  { value: 'Vancouver Island', label: 'Vancouver Island Health' },
  { value: 'Northern', label: 'Northern Health' },
];

export const PSIForm = ({ initialValues = PSI_INITIAL_VALUES, onSubmit, onClose, id = null }) => {
  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  // Helper
  const handleFormSubmit = async (values) => {
    setIsLoading(true);
    let result;
    if (id) {
      result = await updatePSI({ id, psi: values });
    } else {
      result = await createPSI({ psi: values });
    }
    setIsLoading(false);
    onSubmit(result);
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={CreatePSISchema}
      onSubmit={(values) => handleFormSubmit(values)}
    >
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            <Field name='instituteName' component={RenderTextField} label='* Institute Name' />
            <Field name='streetAddress' component={RenderTextField} label='Street Address' />
            <Field name='city' component={RenderTextField} label='City' />
            <Field name='postalCode' component={RenderTextField} label='* Postal Code' />
            <Field
              name='healthAuthority'
              component={RenderSelectField}
              label='* Health Authority'
              options={HEALTH_AUTHORITIES}
            />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justify='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                <Button
                  disabled={isLoading}
                  loading={isLoading}
                  onClick={submitForm}
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
