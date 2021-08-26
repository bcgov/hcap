import React from 'react';
import { Box, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderCheckbox } from '../fields';
export const PEOIWithdrawalDialogForm = ({
  initialValues,
  validationSchema,
  onSubmit,
  onClose,
}) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {(props) => (
        <FormikForm style={{ padding: '30px', maxWidth: '600px' }}>
          <Typography variant={'h3'}>Withdraw from program</Typography>

          <hr />
          <Typography>
            You are going to withdraw from the program. you will no longer receive news and
            notifications from this program. If you want to join HCAP again, you need to submit
            another Participant Expression of Interest.
          </Typography>
          <Field name='confirmed' component={RenderCheckbox} label='Please click here to confirm' />
          <Box mt={3}>
            <Grid container spacing={2} justify='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                <Button
                  onClick={props.submitForm}
                  variant='contained'
                  color='primary'
                  text='Submit'
                />
              </Grid>
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
