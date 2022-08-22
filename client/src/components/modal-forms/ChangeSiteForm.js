import React from 'react';
import _orderBy from 'lodash/orderBy';

import Alert from '@material-ui/lab/Alert';
import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderAutocomplete, RenderSelectField, RenderDateField } from '../fields';
import { Button } from '../generic';
import {
  rosPositionType,
  rosEmploymentType,
  healthAuthorities,
  ROS_SITE_INFO_MESSAGE,
  MAX_LABEL_LENGTH,
} from '../../constants';
import { addEllipsisMask, getTodayDate } from '../../utils';

const useStyles = makeStyles((theme) => ({
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
  formLabel: {
    marginBottom: theme.spacing(1),
    fontWeight: 700,
    color: theme.palette.headerText.secondary,
  },
}));

export const ChangeSiteForm = ({ initialValues, sites, validationSchema, onSubmit, onClose }) => {
  const classes = useStyles();

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm, setFieldValue, validateField }) => (
        <FormikForm>
          <Box my={1}>
            <FastField
              name='startDate'
              component={RenderDateField}
              label='Start Date at a New Site'
              maxDate={getTodayDate()}
              boldLabel
            />
          </Box>

          <Box my={2}>
            <FastField
              name='positionType'
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
              name='employmentType'
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
              name='site'
              component={RenderAutocomplete}
              label='New Site Name'
              boldLabel
              options={_orderBy(sites, ['siteName']).map((item) => ({
                value: item.siteId,
                label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
              }))}
              onItemChange={(_, item) => {
                const siteId = item?.value;
                const siteHA = sites.find((site) => site.siteId === siteId)?.healthAuthority;
                const healthAuthority = healthAuthorities.find((ha) => ha.value === siteHA)?.value;
                setFieldValue('healthAuthority', healthAuthority || '');
                validateField('healthAuthority');
              }}
            />
            <Box mt={1}>
              <Alert severity='info'>{ROS_SITE_INFO_MESSAGE}</Alert>
            </Box>
          </Box>

          <Box my={2}>
            <FastField
              name='healthAuthority'
              component={RenderSelectField}
              label='Health Authority'
              boldLabel
              disabled
              options={healthAuthorities}
            />
          </Box>

          <Divider className={classes.formDivider} />

          <Box display='flex' justifyContent='space-between'>
            <Button
              className={classes.formButton}
              onClick={onClose}
              variant='outlined'
              text='Cancel'
            />
            <Button
              type='submit'
              className={classes.formButton}
              onClick={submitForm}
              text='Confirm'
            />
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
