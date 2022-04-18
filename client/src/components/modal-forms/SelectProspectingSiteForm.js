import React from 'react';
import { Box, Divider, Typography } from '@material-ui/core';
import { RenderMultiSelectField } from '../fields';
import { Button } from '../generic';
import { FastField, Formik, Form as FormikForm } from 'formik';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  formLabel: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
}));

export const SelectProspectingSiteForm = ({
  initialValues,
  validationSchema,
  onSubmit,
  onClose,
}) => {
  const classes = useStyles();

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Typography className={classes.formLabel} variant='subtitle2'>
            Please select site(s) this participant is prospecting for
          </Typography>
          <FastField
            name='participantSites'
            component={RenderMultiSelectField}
            placeholder='Select Site'
            // TODO: get the list of options
            options={[
              { value: 'opt1', label: 'option 1' },
              { value: 'opt2', label: 'option 2' },
              { value: 'opt3', label: 'option 3' },
              { value: 'opt4', label: 'option 4' },
            ]}
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
              text='Submit'
            />
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
