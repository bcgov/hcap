import React from 'react';
import { Field, Formik, Form as FormikForm } from 'formik';

import { Box, Icon, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';

import { RenderTextField } from '../fields';
import { Button } from '../generic';
import { EmailSubmissionSchema } from '../../constants';
import { API_URL, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';

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
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  submissionHeader: {
    color: '#1a5a96',
    marginBottom: '1rem',
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      margin: '0 1rem 1rem 1rem',
      fontSize: '1.5rem',
      lineHeight: '1.75rem',
    },
  },
}));

const addEmailToWhitelist = async (email) => {
  const resp = await fetch(`${API_URL}/api/v1/participants/waitlist`, {
    headers: { Accept: 'application/json', 'Content-type': 'application/json' },
    body: JSON.stringify({ email }),
    method: 'POST',
  });
  return resp.ok;
};

export const EmailSubmissionForm = () => {
  const classes = useStyles();
  const { openToast } = useToast();
  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);

    let resp = false;
    try {
      resp = await addEmailToWhitelist(values.email);
    } catch (e) {
      resp = false;
    }
    if (resp) {
      openToast({
        status: ToastStatus.Success,
        message: 'Your email has been added to the waitlist.',
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: 'An error occured.',
      });
    }

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

export const EmailSubmissionHeader = () => {
  const classes = useStyles();

  return (
    <Typography variant='subtitle1' className={classes.submissionHeader}>
      Get notified when the submissions are open
    </Typography>
  );
};
