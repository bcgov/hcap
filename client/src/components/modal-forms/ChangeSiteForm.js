import React, { useMemo } from 'react';
import _orderBy from 'lodash/orderBy';
import { AuthContext } from '../../providers';

import { Box, Divider, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderSelectField } from '../fields';
import { Button } from '../generic';
import { addEllipsisMask } from '../../utils';

const useStyles = makeStyles((theme) => ({
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  formLabel: {
    marginBottom: theme.spacing(1),
    fontWeight: 700,
    color: theme.palette.headerText.secondary,
  },
}));

export const ChangeSiteForm = ({
  isMultiSelect,
  selected,
  initialValues,
  validationSchema,
  onSubmit,
  onClose,
}) => {
  const { auth } = AuthContext.useAuth();
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);
  const classes = useStyles();

  const MAX_LABEL_LENGTH = 50;
  const canSeeMultiSelect = isMultiSelect && selected?.length > 1;

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Typography className={classes.formLabel} variant='subtitle2'>
            {`Please select the site ${
              canSeeMultiSelect
                ? `for ${selected?.length} participants`
                : 'this participant is prospecting for'
            }`}
          </Typography>
          <FastField
            name='prospectingSite'
            component={RenderSelectField}
            placeholder='Select Site'
            options={_orderBy(sites, ['siteName']).map((item) => ({
              value: item.siteId,
              label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
            }))}
          />

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
