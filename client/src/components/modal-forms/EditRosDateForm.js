import React from 'react';

import { Box } from '@mui/material';
import { Formik, Form as FormikForm, FastField } from 'formik';

import { FormButtons } from './form-components';
import { RenderDateField } from '../fields';
import { useFormConfirmation } from '../../hooks/useFormConfirmation';
import { rosEditWarning } from '../../constants';

export const EditRosDateForm = ({ initialValues, onSubmit, onClose, validationSchema }) => {
  const [openConfirmation, FormConfirmation] = useFormConfirmation(onSubmit, rosEditWarning);

  return (
    <Formik
      onSubmit={openConfirmation}
      initialValues={initialValues}
      validationSchema={validationSchema}
    >
      <FormikForm>
        <Box my={1}>
          <FastField name='date' component={RenderDateField} label='Start Date' boldLabel />
        </Box>
        <FormButtons onClose={onClose} />
        <FormConfirmation />
      </FormikForm>
    </Formik>
  );
};
