import React from 'react';
import store from 'store';
import * as yup from 'yup';
import { Typography, Box, Grid, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Form } from '../../components/participant-form';
import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderTextField } from '../../components/fields';
import { Button } from '../../components/generic';

import Notifications from '@material-ui/icons/Notifications';

export const DisabledForm = ({}) => {
  const handleSubmit = (values, { setSubmitting }) => {
    console.log('submitted', { values });
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <img
        src='hero.png'
        alt=''
        style={{ width: '100%', minHeight: '300px', zIndex: '0', objectFit: 'cover' }}
      />

      <div
        style={{
          top: '100%',
          transform: 'translateY(-50%)',
          position: 'absolute',
          zIndex: '1',
          background: 'white',
          padding: '3rem 7.5rem',
          borderRadius: '.25rem',
          textAlign: 'center',
          width: 'clamp(775px, 65%, 1000px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant='h1'
          style={{
            position: 'absolute',
            zIndex: '1',
            color: 'white',
            bottom: '100%',
            marginBottom: '2rem',
          }}
        >
          Work In The Health Care Sector
        </Typography>
        <Box mb={3}>
          <Typography variant='h2'>Submissions are temporarily closed</Typography>
        </Box>
        <div></div>
        <Typography
          variant='body1'
          style={{ fontSize: '16px', marginBottom: '1rem', lineHeight: '24px' }}
        >
          The participant expression of interest for the HCAP program is now closed and may reopen
          as more opportunities become available. Thank you for your interest in the program. To
          learn more, visit the{' '}
          <a href='https://gov.bc.ca/careersinhealth' target='_blank' rel='noreferrer'>
            Health Career Access Program
          </a>
          .
        </Typography>
        <Typography
          variant='body1'
          style={{ fontSize: '16px', marginBottom: '1rem', lineHeight: '24px' }}
        >
          Eligible employers will continue to reach out to those who are currently in the system. If
          you have any questions, please email{' '}
          <a href='mailto:HCAPInfoQuery@gov.bc.ca' target='_blank' rel='noreferrer'>
            HCAPInfoQuery@gov.bc.ca
          </a>
          .
        </Typography>

        <Box
          style={{
            position: 'absolute',
            zIndex: '1',
            top: '100%',
            marginTop: '1rem',
          }}
        >
          <Typography variant='subtitle1' style={{ color: '#1a5a96', marginBottom: '1rem' }}>
            Get notified when the submissions are open
          </Typography>
          <Formik
            initialValues={{ email: '' }}
            validationSchema={yup.object().shape({
              email: yup.string().email().required('Required'),
            })}
            onSubmit={handleSubmit}
          >
            <FormikForm>
              <Box
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-end',
                }}
              >
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    flexGrow: '1',
                  }}
                >
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
                  text={
                    <>
                      <Icon mar component={Notifications} />
                      Notify me
                    </>
                  }
                  fullWidth={false}
                  style={{ marginTop: '1rem' }}
                />
              </Box>
            </FormikForm>
          </Formik>
        </Box>
      </div>
    </div>
  );
};
