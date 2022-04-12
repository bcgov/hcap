import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import MuiAlert from '@material-ui/lab/Alert';
import { Button } from '../generic';
import { Box, Typography } from '@material-ui/core';
import { RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { ParticipantAssignCohortSchema } from '../../constants';
import { psi, assignParticipantWithCohort } from '../../services';

// Helpers
const fetchPSIData = async () => {
  const psiData = (await psi()) || [];
  const cohortMap = {};
  const psiMappedData = psiData.map((psi) => {
    const mappedData = {
      value: psi.id,
      label: psi.institute_name,
    };
    const cohorts = psi.cohorts.map((cohort) => ({
      value: cohort.id,
      label: cohort.cohort_name,
      availableSize: cohort.availableSize,
    }));
    cohortMap[psi.id] = cohorts;
    return mappedData;
  });

  return { psiMappedData, cohortMap, psiData };
};

// Post Cohort Assignment Form
const postCohortAssignmentForm = async ({
  values,
  participantId,
  afterPostAction,
  setShowError,
  cachedPSIData,
}) => {
  try {
    await assignParticipantWithCohort({ participantId, cohortId: values.cohort });
    const psi = cachedPSIData.find((psi) => psi.id === values.institute);
    const cohort = psi.cohorts.find((cohort) => cohort.id === values.cohort);
    afterPostAction(cohort);
  } catch (error) {
    setShowError(true);
  }
};

export const AssignCohortForm = ({
  initialValues = {
    institute: '',
    cohort: '',
    availableSize: '',
  },
  onClose,
  onSubmit,
  participantId,
}) => {
  // State: PSI List to fill the select field
  const [psiList, setPSIList] = useState([]);
  // State: Cohort list connected with the PSI
  const [cohorts, setCohorts] = useState([]);
  // State Cohort Map
  const [cohortMapData, setCohortMapData] = useState({});
  // State: Cached PSI data
  const [cachedPSIData, setCachedPSIData] = useState([]);

  const [availableSize, setAvailableSize] = useState(0);

  // Show Error
  const [showError, setShowError] = useState(false);

  // UseEffect: Fetch PSI List
  useEffect(() => {
    fetchPSIData().then(({ psiMappedData, cohortMap, psiData }) => {
      setPSIList(psiMappedData);
      setCohortMapData(cohortMap);
      setCachedPSIData(psiData);
    });
  }, [setPSIList, setCohortMapData, setCachedPSIData]);

  return (
    <Box spacing={8} p={10}>
      <Formik
        initialValues={initialValues}
        validationSchema={ParticipantAssignCohortSchema}
        onSubmit={(values) =>
          postCohortAssignmentForm({
            values,
            participantId,
            afterPostAction: onSubmit,
            setShowError,
            cachedPSIData,
          })
        }
      >
        {({ submitForm, values, setFieldValue }) => (
          <FormikForm>
            <Typography color={'primary'} variant={'h4'}>
              {' '}
              Assign Cohort
            </Typography>
            <hr />
            <MuiAlert severity='warning'>
              {
                'This participant has not been assigned a cohort. Please assign a cohort in order to track graduation.'
              }
            </MuiAlert>
            <br />
            <>
              {showError && (
                <MuiAlert severity='error'>
                  {'Unable to assign cohort. Please try again later.'}
                </MuiAlert>
              )}
            </>
            <br />
            <Box>
              <Field
                name='institute'
                type='number'
                component={RenderSelectField}
                label='* Institute'
                placeholder='Select institute'
                options={psiList}
                onChange={({ target }) => {
                  const { value } = target;
                  setFieldValue('institute', value);
                  setCohorts(cohortMapData[value]);
                }}
              />
              <Field
                name='cohort'
                type='number'
                component={RenderSelectField}
                placeholder='Select cohort'
                label='* Cohort'
                options={cohorts}
                onChange={({ target }) => {
                  const { value } = target;
                  setFieldValue('cohort', value);
                  const size = cohorts.find((cohort) => cohort.value === value).availableSize ?? 0;
                  setAvailableSize(size);
                }}
              />
              <Field name='availableSize' type='hidden' value={availableSize} />
            </Box>
            <Box mt={3}>
              <Grid container spacing={2} justify='flex-end'>
                <Grid item>
                  <Button onClick={onClose} color='default' text='Cancel' />
                </Grid>
                <Grid item>
                  <Button
                    test-id={'updateGraduationStatus'}
                    onClick={submitForm}
                    variant='contained'
                    color='primary'
                    text='Save Changes'
                  />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
        )}
      </Formik>
    </Box>
  );
};
