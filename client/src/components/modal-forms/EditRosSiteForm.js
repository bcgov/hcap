import React from 'react';
import _orderBy from 'lodash/orderBy';

import { Box } from '@material-ui/core';
import { FastField } from 'formik';

import { EditRosTemplate } from './form-components';
import { RenderAutocomplete } from '../fields';
import { MAX_LABEL_LENGTH } from '../../constants';
import { addEllipsisMask } from '../../utils';

export const EditRosSiteForm = ({ initialValues, onSubmit, onClose, validationSchema, sites }) => {
  return (
    <EditRosTemplate
      initialValues={initialValues}
      onSubmit={onSubmit}
      onClose={onClose}
      validationSchema={validationSchema}
    >
      <Box my={1}>
        <FastField
          name='siteName'
          component={RenderAutocomplete}
          label='Site'
          boldLabel
          options={_orderBy(sites, ['siteName']).map((item) => ({
            value: item.siteId,
            label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
          }))}
        />
      </Box>
    </EditRosTemplate>
  );
};
