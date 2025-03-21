import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box, makeStyles } from '@material-ui/core';
import { RenderTextField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
  },
}));

export const EditHiredParticipantForm = ({
  initialValues,
  validationSchema,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const classes = useStyles();
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Box>
            <Box pt={1} pb={1}>
              <Typography variant='body1'>
                <b>Site Hired Participant</b>
              </Typography>
            </Box>
            {/* Add Participant ID */}
            <Field name='participant_id' component={RenderTextField} label='* Participant ID' />
            <Field name='hiredDate' component={RenderTextField} label='* Hire Date' />
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} justify='flex-end'>
              <Grid item>
                <Button onClick={onClose} color='default' text='Cancel' />
              </Grid>
              <Grid item>
                {isLoading ? (
                  <div className={classes.root}>
                    <CircularProgress />
                  </div>
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
