import React from 'react';

import { Box } from '@material-ui/core';
import { Formik, Form as FormikForm, FastField } from 'formik';

import { EditRosTemplate } from './form-components';
import { RenderDateField } from '../fields';

export const EditRosStartDateForm = ({ initialValues, onSubmit, onClose, validationSchema }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema}>
      {({ validateForm, values }) => (
        <FormikForm>
          <EditRosTemplate
            onSubmit={onSubmit}
            onClose={onClose}
            values={values}
            validateForm={validateForm}
          >
            <Box my={1}>
              <FastField
                name='startDate'
                component={RenderDateField}
                label='Start Date at Current Site'
                boldLabel
              />
            </Box>
          </EditRosTemplate>
        </FormikForm>
      )}
    </Formik>
  );
};
