/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box, Typography } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { RenderDateField, RenderCheckbox, RenderTextField, RenderSelectField } from '../fields';
import { flagKeys, featureFlag } from '../../services';
import { fetchSitePhases } from '../../services/phases';
import { Field, Formik, Form as FormikForm } from 'formik';
import { getTodayDate } from '../../utils';
import { HireFormSchema } from '../../constants';

const hireInitialValues = {
  nonHcapOpportunity: false,
  positionTitle: '',
  positionType: '',
  hiredDate: '',
  startDate: '',
  site: '',
  acknowledge: false,
};

export const HireForm = ({ onSubmit, onClose, sites }) => {
  const [phases, setPhases] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [formValues, setformValues] = useState(hireInitialValues);

  const handleCurrentPhase = async (siteId) => {
    const site = sites.filter((site) => site.siteId === siteId)[0];
    let phases = await fetchSitePhases(site.id);
    setPhases(phases);
  };

  useEffect(() => {
    const { hiredDate, site } = formValues;
    if (hiredDate && site && phases.length) {
      const cPhase = phases?.filter(
        (phase) =>
          Date.parse(phase.startDate) <= Date.parse(hiredDate) &&
          Date.parse(hiredDate) <= Date.parse(phase.endDate)
      )[0];
      setCurrentPhase(cPhase);
    }
  }, [formValues, phases]);

  return (
    <Formik initialValues={hireInitialValues} validationSchema={HireFormSchema} onSubmit={onSubmit}>
      {({ submitForm, values, setFieldValue }) => {
        setformValues(values);
        return (
          <FormikForm>
            <Box>
              <Field
                name='nonHcapOpportunity'
                component={RenderCheckbox}
                label='Non-HCAP Opportunity'
              />
              {values.nonHcapOpportunity && (
                <>
                  <Field
                    name='positionTitle'
                    component={RenderTextField}
                    label='* Position Title'
                  />
                  <Field
                    name='positionType'
                    component={RenderSelectField}
                    label='* Position Type'
                    options={[
                      { value: 'Full-Time', label: 'Full-Time' },
                      { value: 'Part-Time', label: 'Part-Time' },
                      { value: 'Casual', label: 'Casual' },
                    ]}
                  />
                </>
              )}
              <Field
                name='hiredDate'
                component={RenderDateField}
                maxDate={getTodayDate()}
                label='* Date Hired'
              />
              <Field name='startDate' component={RenderDateField} label='* Start Date' />
              <Field
                name='site'
                component={RenderSelectField}
                label='* Site'
                onChange={(e) => {
                  handleCurrentPhase(e.target.value);
                  setFieldValue('site', e.target.value);
                }}
                options={sites.map((siteDetail) => ({
                  value: siteDetail.siteId,
                  label: siteDetail.siteName,
                }))}
              />
              <Field
                name='acknowledge'
                component={RenderCheckbox}
                label='I acknowledge that the participant has accepted the offer in writing.'
              />
            </Box>

            {!values.nonHcapOpportunity &&
              currentPhase &&
              featureFlag(flagKeys.FEATURE_PHASE_ALLOCATION) && (
                <Box mt={2} gap={15}>
                  <Alert severity='info'>
                    <Typography variant='body2' gutterBottom>
                      {currentPhase.allocation || currentPhase.allocation === 0 ? (
                        <>
                          This site has <b>{currentPhase.allocation}</b> allocations assigned and
                          has <b>{currentPhase.remainingHires}</b> remaining slots.
                        </>
                      ) : (
                        <>
                          The site currenty has 0 allocations assigned. Please contat your Health
                          Authority for further information.
                        </>
                      )}
                    </Typography>
                  </Alert>
                </Box>
              )}
            <Box mt={3}>
              <Grid container spacing={2} justify='flex-end'>
                <Grid item>
                  <Button onClick={onClose} color='default' text='Cancel' />
                </Grid>
                <Grid item>
                  <Button onClick={submitForm} variant='contained' color='primary' text='Submit' />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
        );
      }}
    </Formik>
  );
};
