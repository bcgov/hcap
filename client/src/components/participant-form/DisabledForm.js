import React from 'react';
import * as yup from 'yup';
import { Typography, Box, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderTextField } from '../../components/fields';
import { Button } from '../../components/generic';

import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  infoContainer: {
    top: '100%',
    transform: 'translateY(-50%)',
    position: 'absolute',
    zIndex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      position: 'static',
      top: 'auto',
      transform: 'none',
      width: '100%',
    },
  },
  infoBox: {
    background: 'white',
    padding: '3rem 7.5rem',
    borderRadius: '.25rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 'clamp(775px, 65%, 1000px)',
    [theme.breakpoints.down('sm')]: {
      position: 'static',
      top: 'auto',
      transform: 'none',
      width: 'auto',
      margin: '1rem',
      padding: '1rem',
    },
  },
  infoBoxHeader: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '2rem',
      lineHeight: '2.25rem',
    },
  },
  infoBoxParagraph: {
    fontSize: '16px',
    marginBottom: '1rem',
    lineHeight: '24px',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'left',
    },
  },
  hero: {
    width: '100%',
    minHeight: '300px',
    zIndex: '0',
    objectFit: 'cover',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  heading: {
    position: 'absolute',
    zIndex: '1',
    color: 'white',
    bottom: '100%',
    marginBottom: '2rem',
    [theme.breakpoints.down('sm')]: {
      background: theme.palette.primary.lighter,
      position: 'static',
      textAlign: 'center',
      top: 'auto',
      transform: 'none',
      width: '100%',
      fontSize: '2rem',
      margin: 0,
      fontWeight: 'bold',
      padding: '2rem',
    },
  },
  submissionContainer: {
    position: 'absolute',
    zIndex: '1',
    top: '100%',
    marginTop: '1rem',
  },
  submissionHeader: {
    color: '#1a5a96',
    margin: '0 1rem 1rem 1rem',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'center',
      fontSize: '1.5rem',
      lineHeight: '1.75rem',
    },
  },
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

export const DisabledForm = () => {
  const classes = useStyles();
  const handleSubmit = async (values, { setSubmitting }) => {
    console.log('submitted', { values });
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);
  };

  return (
    <Box className={classes.container}>
      <img src='hero.png' alt='' className={classes.hero} />

      <div className={classes.infoContainer}>
        <Typography variant='h1' className={classes.heading}>
          Work In The Health Care Sector
        </Typography>
        <Box className={classes.infoBox}>
          <Box mb={3}>
            <Typography variant='h2' className={classes.infoBoxHeader}>
              Submissions are temporarily closed
            </Typography>
          </Box>

          <Typography variant='body1' className={classes.infoBoxParagraph}>
            The participant expression of interest for the HCAP program is now closed and may reopen
            as more opportunities become available. Thank you for your interest in the program. To
            learn more, visit the{' '}
            <a href='https://gov.bc.ca/careersinhealth' target='_blank' rel='noreferrer'>
              Health Career Access Program
            </a>
            .
          </Typography>
          <Typography variant='body1' className={classes.infoBoxParagraph}>
            Eligible employers will continue to reach out to those who are currently in the system.
            If you have any questions, please email{' '}
            <a href='mailto:HCAPInfoQuery@gov.bc.ca' target='_blank' rel='noreferrer'>
              HCAPInfoQuery@gov.bc.ca
            </a>
            .
          </Typography>
        </Box>

        <Box className={classes.submissionContainer}>
          <Typography variant='subtitle1' className={classes.submissionHeader}>
            Get notified when the submissions are open
          </Typography>
          <Formik
            initialValues={{ email: '' }}
            validationSchema={yup.object().shape({
              email: yup.string().email().required('Required'),
            })}
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
        </Box>
      </div>
    </Box>
  );
};
