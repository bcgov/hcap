import React from 'react';

import { Box } from '@material-ui/core';
import { Formik, Form as FormikForm, FastField } from 'formik';

import { EditRosTemplate } from './form-components';
import { RenderDateField } from '../fields';

export const EditRosStartDateForm = ({ initialValues, onSubmit, onClose, validationSchema }) => {
  const fieldName = 'startDate';

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ validateForm, setFieldTouched, values }) => (
        <FormikForm>
          <EditRosTemplate
            onSubmit={onSubmit}
            onClose={onClose}
            values={values}
            getValidationResult={async () => {
              await setFieldTouched(fieldName);
              const res = await validateForm();
              return Object.entries(res)?.length === 0;
            }}
          >
            <Box my={1}>
              <FastField
                name={fieldName}
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
