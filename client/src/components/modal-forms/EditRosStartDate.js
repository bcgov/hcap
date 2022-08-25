import React from 'react';

import { Box } from '@material-ui/core';
import { FastField } from 'formik';

import { EditRosTemplate } from './form-components';
import { RenderDateField } from '../fields';

export const EditRosStartDate = ({ initialValues, onSubmit, onClose, validationSchema }) => {
  return (
    <EditRosTemplate
      initialValues={initialValues}
      onSubmit={onSubmit}
      onClose={onClose}
      validationSchema={validationSchema}
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
  );
};
