import React from 'react';
import { Box, CircularProgress, Grid, styled } from '@mui/material';
import { Button } from '../generic';
import { RenderTextField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  '& > * + *': {
    marginLeft: theme.spacing(2),
  },
}));

export const EditHiredParticipantForm = ({
  initialValues,
  validationSchema,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            {/* Add Participant ID */}
            <Field name='participant_id' component={RenderTextField} style={{ display: 'none' }} />
            <Field name='hiredDate' component={RenderTextField} label='* Hire Date' />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justifyContent='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                {isLoading ? (
                  <LoadingContainer>
                    <CircularProgress />
                  </LoadingContainer>
                ) : (
                  <Button onClick={submitForm} variant='contained' color='primary' text='Submit' />
                )}
              </Grid>
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
