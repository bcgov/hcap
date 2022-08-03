import React from 'react';
import _orderBy from 'lodash/orderBy';

import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderAutocomplete, RenderSelectField, RenderDateField } from '../fields';
import { Button } from '../generic';
import { rosPositionType, rosEmploymentType, MAX_LABEL_LENGTH } from '../../constants';
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

export const EditParticipantField = ({
  initialValues,
  sites,
  onSubmit,
  onClose,
  validationSchema,
  labelName,
  fieldName,
}) => {
  const classes = useStyles();

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box my={1}>
            <FastField
              name={fieldName}
              component={RenderDateField}
              label={labelName}
              maxDate={getTodayDate()}
              boldLabel
            />
          </Box>

          <Box my={2}>
            <FastField
              name={fieldName}
              component={RenderAutocomplete}
              label={labelName}
              boldLabel
              options={_orderBy(sites, ['siteName']).map((item) => ({
                value: item.siteId,
                label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
              }))}
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
