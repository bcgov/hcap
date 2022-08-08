import React from 'react';

import { Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderAutocomplete, RenderDateField } from '../fields';
import { Button } from '../generic';
import { mohEditType } from '../../constants';

const useStyles = makeStyles((theme) => ({
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
}));

export const EditParticipantField = ({
  initialValues,
  onSubmit,
  onClose,
  validationSchema,
  type,
  fieldName,
  fieldLabel,
  fieldOptions,
}) => {
  const classes = useStyles();

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onClose}>
      {({ validateForm, values }) => (
        <FormikForm>
          <Box mb={2}>
            {type === mohEditType.DATE && (
              <Box my={1}>
                <FastField
                  name={fieldName}
                  component={RenderDateField}
                  label={fieldLabel}
                  boldLabel
                />
              </Box>
            )}

            {type === mohEditType.AUTOCOMPLETE && (
              <Box my={1}>
                <FastField
                  name={fieldName}
                  component={RenderAutocomplete}
                  label={fieldLabel}
                  boldLabel
                  options={fieldOptions || []}
                />
              </Box>
            )}

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
                onClick={async () => {
                  const res = await validateForm();
                  if (Object.entries(res)?.length === 0) {
                    onSubmit(values);
                  }
                }}
                text='Confirm'
              />
            </Box>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
