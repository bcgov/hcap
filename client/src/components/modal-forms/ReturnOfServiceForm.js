import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import MuiAlert from '@material-ui/lab/Alert';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import {
  RenderDateField,
  RenderRadioGroup,
  RenderCheckbox,
  RenderSelectField,
  RenderTextField,
} from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import {
  ReturnOfServiceSchema,
  rosPositionType,
  rosEmploymentType,
  ROS_SITE_INFO_MESSAGE,
} from '../../constants';
import { createReturnOfServiceStatus, getAllSites } from '../../services';

// Helpers
const rosPositionTypeOptions = Object.values(rosPositionType);
const rosEmploymentTypeOptions = Object.values(rosEmploymentType);

// API caller
const postRoS = async ({ values, participantId, setError }) => {
  try {
    const { date, employmentType, positionType, sameSite, site } = values;
    await createReturnOfServiceStatus({
      participantId,
      siteId: site || null,
      data: {
        date,
        employmentType,
        positionType,
        sameSite,
      },
    });
    return true;
  } catch (error) {
    setError(error.message);
    return false;
  }
};

// Fetch sites
const fetchSites = async ({ setSites, setError }) => {
  try {
    const { data = [] } = await getAllSites();
    setSites(data);
  } catch (error) {
    setError(error.message);
  }
};

const mapToOptions = (sites) =>
  sites.map((site) => ({
    value: site.id,
    label: `${site.siteName} - ${site.siteId}`,
  }));

// Styles
const useStyles = makeStyles({
  bg: {
    backgroundColor: '#e8e8e8',
  },
});

// Post Cohort Assignment Form

export const ReturnOfServiceForm = ({
  initialValues = {
    date: '',
    positionType: '',
    employmentType: '',
    sameSite: true,
    confirm: '',
    site: '',
    ha: '',
  },
  onClose,
  participantId,
  completionHandler,
}) => {
  // Style Classes
  const classes = useStyles();
  // Show Error
  const [error, setError] = useState(null);
  // All sites
  const [sites, setSites] = useState([]);

  // Handle UI events
  const handleSiteSelection = ({ target }, setFieldValue) => {
    const { value } = target;
    setFieldValue('site', value);
    // Get site details
    const site = sites.find((s) => s.id === value);
    setFieldValue('ha', site.healthAuthority);
  };

  // Hooks
  useEffect(() => {
    fetchSites({ setSites, setError });
  }, [setSites, setError]);

  return (
    <Box spacing={2} p={0.2}>
      <Formik
        initialValues={initialValues}
        validationSchema={ReturnOfServiceSchema}
        onSubmit={async (values) => {
          const success = await postRoS({ values, participantId, setError });
          if (success) {
            onClose();
            completionHandler(true, 'Successfully updated Return of Service status!');
          }
        }}
      >
        {({ submitForm, values, setFieldValue }) => (
          <FormikForm>
            <>{error !== null && <MuiAlert severity='error'>{error}</MuiAlert>}</>
            <br />
            <Box>
              <Field
                name='date'
                component={RenderDateField}
                label='Return of Service Start Date'
                maxDate={'2100-01-01'}
                boldLabel
              />
              <br />
              <Box className={classes.bg}>
                <Box p={1}>
                  <Field
                    name='positionType'
                    component={RenderRadioGroup}
                    label='Position Type'
                    options={rosPositionTypeOptions}
                    boldLabel
                  />
                  <Field
                    name='employmentType'
                    component={RenderRadioGroup}
                    label='Specific position type (optional)'
                    options={rosEmploymentTypeOptions}
                    boldLabel
                  />
                </Box>
              </Box>
              <br />
              <Field
                name='sameSite'
                component={RenderRadioGroup}
                label='Is this participant completing their RoS at their same site?'
                options={[
                  {
                    value: true,
                    label: 'Yes',
                  },
                  {
                    value: false,
                    label: 'No',
                  },
                ]}
                boldLabel
                onChange={({ target }) => {
                  const { value } = target;
                  setFieldValue('sameSite', value);
                  if (value) {
                    setFieldValue('site', '');
                    setFieldValue('ha', '');
                  }
                }}
              />
              {values.sameSite === false && (
                <Box mt={3} mb={2}>
                  <Field
                    name='site'
                    component={RenderSelectField}
                    label='New Site'
                    options={mapToOptions(sites)}
                    onChange={(event) => handleSiteSelection(event, setFieldValue)}
                    boldLabel
                  />
                  <Box mt={3}>
                    <Field
                      name='ha'
                      component={RenderTextField}
                      label='Health Authority'
                      disabled
                      boldLabel
                    />
                  </Box>
                </Box>
              )}
              <>
                {values.sameSite === false && (
                  <MuiAlert severity='info'>{ROS_SITE_INFO_MESSAGE}</MuiAlert>
                )}
              </>
              <br />
              <Box className={classes.bg}>
                <Box p={1}>
                  <Field
                    name='confirm'
                    component={RenderCheckbox}
                    label='I acknowledge that this participant has been registered as HCA.'
                  />
                </Box>
              </Box>
            </Box>
            <Box mt={3}>
              <Grid container spacing={2} justify='flex-end'>
                <Grid item>
                  <Button onClick={onClose} color='default' text='Cancel' />
                </Grid>
                <Grid item>
                  <Button onClick={submitForm} variant='contained' color='primary' text='Confirm' />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Box>
  );
};
