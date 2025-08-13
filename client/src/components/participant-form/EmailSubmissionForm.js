import React from 'react';
import { Field, Formik, Form as FormikForm } from 'formik';
import { Box, Icon, Typography, styled } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { RenderTextField } from '../fields';
import { Button } from '../generic';
import { EmailSubmissionSchema, API_URL, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';

const SubmissionForm = styled('form')(({ theme }) => ({
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
  [theme.breakpoints.down('sm')]: {
    width: 'auto',
    margin: '1rem',
    flexDirection: 'column',
    gap: 0,
  },
}));

const SubmissionInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flexGrow: 1,
  width: '20rem',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

const SubmissionButton = styled(Button)(({ theme }) => ({
  marginTop: '1rem',
  minWidth: '8.5rem',
  whiteSpace: 'nowrap',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

const SubmissionHeader = styled(Typography)(({ theme }) => ({
  color: '#1a5a96',
  marginBottom: '1rem',
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    margin: '0 1rem 1rem 1rem',
    fontSize: '1.5rem',
    lineHeight: '1.75rem',
  },
}));

const addEmailToWaitlist = async (email, openToast) => {
  const resp = await fetch(`${API_URL}/api/v1/participants/waitlist`, {
    headers: { Accept: 'application/json', 'Content-type': 'application/json' },
    body: JSON.stringify({ email }),
    method: 'POST',
  });
  if (resp.ok) {
    openToast({
      status: ToastStatus.Success,
      message:
        'Your email has been added to the list. You will be notified when submissions are open.',
    });
  } else if (resp.status === 409) {
    openToast({
      status: ToastStatus.Info,
      message: 'Your email address was already on the list.',
    });
  } else {
    throw new Error();
  }
};

export const EmailSubmissionForm = () => {
  const { openToast } = useToast();
  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    try {
      await addEmailToWaitlist(values.email, openToast);
    } catch (e) {
      openToast({
        status: ToastStatus.Error,
        message: 'An error occurred.',
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
        <SubmissionForm as={FormikForm}>
          <SubmissionInputContainer>
            <Field
              name='email'
              component={RenderTextField}
              label='Email'
              placeholder='Type your email here'
            />
          </SubmissionInputContainer>
          <SubmissionButton
            type='submit'
            variant='contained'
            color='primary'
            loading={isSubmitting}
            text={
              <Box display='flex' alignItems='center'>
                <Icon component={NotificationsActiveIcon} sx={{ marginRight: '.5rem' }} />
                Notify me
              </Box>
            }
            fullWidth={false}
          />
        </SubmissionForm>
      )}
    </Formik>
  );
};

export const EmailSubmissionHeader = () => {
  return (
    <SubmissionHeader variant='subtitle1'>
      Get notified when the submissions are open
    </SubmissionHeader>
  );
};
