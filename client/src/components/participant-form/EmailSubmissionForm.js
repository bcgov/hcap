import React from 'react';
import { Field, Formik, Form as FormikForm } from 'formik';

import { Box, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';

import { RenderTextField } from '../fields';
import { Button } from '../generic';
import { EmailSubmissionSchema } from '../../constants';

const useStyles = makeStyles((theme) => ({
  submissionInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexGrow: '1',
    width: '20rem',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  submissionForm: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      margin: '1rem',
      flexDirection: 'column',
      gap: '0',
    },
  },
  submissionButton: {
    marginTop: '1rem',
    minWidth: '8.5rem',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

export const EmailSubmissionForm = () => {
  const classes = useStyles();

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log('submitted', { values });
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);
  };
  return (
    <Formik
      initialValues={{ email: '' }}
      validationSchema={EmailSubmissionSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <FormikForm className={classes.submissionForm}>
          <Box className={classes.submissionInputContainer}>
            <Field
              name='email'
              component={RenderTextField}
              label='Email'
              placeholder='Type your email here'
            />
          </Box>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            loading={isSubmitting}
            className={classes.submissionButton}
            text={
              <Box display='flex' alignItems='center'>
                <Icon component={NotificationsActiveIcon} style={{ marginRight: '.5rem' }} />
                Notify me
              </Box>
            }
            fullWidth={false}
          />
        </FormikForm>
      )}
    </Formik>
  );
};
