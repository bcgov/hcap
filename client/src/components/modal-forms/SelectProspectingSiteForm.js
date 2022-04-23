import React, { useMemo } from 'react';
import _orderBy from 'lodash/orderBy';
import { AuthContext } from '../../providers';

import { Box, Divider, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderMultiSelectField } from '../fields';
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

export const SelectProspectingSiteForm = ({
  isMultiSelect,
  selectedIds,
  initialValues,
  validationSchema,
  onSubmit,
  onClose,
}) => {
  const { auth } = AuthContext.useAuth();
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);
  const classes = useStyles();

  const getFormLabel = (isMultiple, selected) => {
    const singleSelectLabel = 'Please select the site(s) this participant is prospecting for';
    const multiSelectLabel = `Please select the site(s) for ${selected?.length} participants`;
    return isMultiple && selected ? multiSelectLabel : singleSelectLabel;
  };

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Typography className={classes.formLabel} variant='subtitle2'>
            {getFormLabel(isMultiSelect, selectedIds)}
          </Typography>
          <FastField
            name='prospectingSites'
            component={RenderMultiSelectField}
            placeholder='Select Site'
            options={_orderBy(sites, ['siteName']).map((item) => ({
              value: item.id,
              label: addEllipsisMask(item.siteName, 50),
            }))}
          />
          {isMultiSelect && (
            <Link
              component='button'
              color='primary'
              variant='subtitle2'
              onClick={() => {
                // TODO: show selected participants
              }}
            >
              View selected participants
            </Link>
          )}
          <Divider className={classes.formDivider} />
          <Box display='flex' justifyContent='space-between'>
            <Button
              className={classes.formButton}
              onClick={onClose}
              variant='outlined'
              text='Cancel'
            />
            <Button className={classes.formButton} onClick={submitForm} text='Submit' />
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
