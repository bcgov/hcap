import React, { useMemo } from 'react';
import _orderBy from 'lodash/orderBy';
import { AuthContext } from '../../providers';

import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderAutocomplete, RenderSelectField, RenderDateField } from '../fields';
import { Button } from '../generic';
import { rosPositionType, rosEmploymentType, healthAuthorities } from '../../constants';
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

export const ChangeSiteForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  const { auth } = AuthContext.useAuth();
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);
  const classes = useStyles();

  const MAX_LABEL_LENGTH = 50;

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box my={1}>
            <FastField
              name='startDate'
              component={RenderDateField}
              minDate={getTodayDate()}
              label='Start Date at a New Site'
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
            />
          </Box>

          <Box my={2}>
            <FastField
              name='healthAuthority'
              component={RenderSelectField}
              label='Health Authority'
              boldLabel
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
