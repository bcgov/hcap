import React from 'react';

import Alert from '@material-ui/lab/Alert';
import { Box } from '@material-ui/core';
import { Formik, Form as FormikForm, FastField } from 'formik';

import { FormButtons } from './form-components';
import { RenderAutocomplete, RenderDateField, RenderSelectField } from '../fields';
import {
  MAX_LABEL_LENGTH,
  rosPositionType,
  rosEmploymentType,
  healthAuthorities,
  ROS_SITE_INFO_MESSAGE,
  rosEditWarning,
} from '../../constants';
import { addEllipsisMask } from '../../utils';
import { useFormConfirmation } from '../../hooks/useFormConfirmation';

export const EditRosSiteForm = ({
  initialValues,
  sites,
  validationSchema,
  onSubmit,
  onClose,
  isMoH,
}) => {
  const [openConfirmation, FormConfirmation] = useFormConfirmation(onSubmit, rosEditWarning);

  const fieldNames = {
    startDate: 'startDate',
    positionType: 'positionType',
    employmentType: 'employmentType',
    site: 'site',
    healthAuthority: 'healthAuthority',
  };

  return (
    <Formik
      onSubmit={openConfirmation}
      initialValues={initialValues}
      validationSchema={validationSchema}
    >
      {({ setFieldValue, validateField }) => (
        <FormikForm>
          <Box my={1}>
            <FastField
              name={fieldNames.startDate}
              component={RenderDateField}
              label='Start Date at a New Site'
              boldLabel
            />
          </Box>

          <Box my={2}>
            <FastField
              name={fieldNames.positionType}
              component={RenderSelectField}
              label='Position Type'
              boldLabel
              options={Object.keys(rosPositionType).map((item) => ({
                value: rosPositionType[item].value,
                label: rosPositionType[item].label,
              }))}
            />
          </Box>

          <Box my={2}>
            <FastField
              name={fieldNames.employmentType}
              component={RenderSelectField}
              label='Employment Type'
              boldLabel
              options={Object.keys(rosEmploymentType).map((item) => ({
                value: rosEmploymentType[item].value,
                label: rosEmploymentType[item].label,
              }))}
            />
          </Box>

          <Box my={2}>
            <FastField
              name={fieldNames.site}
              component={RenderAutocomplete}
              label='New Site Name'
              boldLabel
              options={sites.map((item) => ({
                value: item.siteId,
                label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
              }))}
              onItemChange={(_, item) => {
                const siteId = item?.value;
                const siteHA = sites.find((site) => site.siteId === siteId)?.healthAuthority;
                const healthAuthority = healthAuthorities.find((ha) => ha.value === siteHA)?.value;
                setFieldValue(fieldNames.healthAuthority, healthAuthority || '');
                validateField(fieldNames.healthAuthority);
              }}
            />
            {!isMoH && (
              <Box mt={1}>
                <Alert severity='info'>{ROS_SITE_INFO_MESSAGE}</Alert>
              </Box>
            )}
          </Box>

          <Box my={2}>
            <FastField
              name={fieldNames.healthAuthority}
              component={RenderSelectField}
              label='Health Authority'
              boldLabel
              disabled
              options={healthAuthorities}
            />
          </Box>
          <FormButtons onClose={onClose} />
          <FormConfirmation />
        </FormikForm>
      )}
    </Formik>
  );
};
