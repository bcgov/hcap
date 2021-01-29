import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderDateField, RenderCheckbox, RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { getTodayDate } from '../../utils';
import store from 'store';

export const HireForm = ({ initialValues, validationSchema, onSubmit, onClose, sites }) => {

  const [sitesDetail, setSitesDetail] = useState([]);

  useEffect(() => {
    const fetchSites = async () => {
      const response = await fetch('/api/v1/employer-sites', {
        headers: { 'Authorization': `Bearer ${store.get('TOKEN')}` },
        method: 'GET',
      });

      if (response.ok) {
        const { data } = await response.json();
        setSitesDetail(data.filter((site) => sites.includes(site.siteId)));
      }
    };

    fetchSites();
  }, [sites]);

  return <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    onSubmit={onSubmit}
  >
    {({ submitForm, values }) => (
      <FormikForm>
        <Box>
          <Field
            name="nonHcapOpportunity"
            component={RenderCheckbox}
            label="Non-HCAP Opportunity"
          />
          {
            values.nonHcapOpportunity && (<>
              <Field
                name="positionTitle"
                component={RenderTextField}
                label="* Position Title"
              />
              <Field
                name="positionType"
                component={RenderSelectField}
                label="* Position Type"
                options={[
                  { value: 'Full-Time', label: 'Full-Time' },
                  { value: 'Part-Time', label: 'Part-Time' },
                  { value: 'Casual', label: 'Casual' },
                ]}
              />
            </>)
          }
          <Field
            name="hiredDate"
            component={RenderDateField}
            maxDate={getTodayDate()}
            label="* Date Hired"
          />
          <Field
            name="startDate"
            component={RenderDateField}
            label="* Start Date"
          />
          <Field
            name="site"
            component={RenderSelectField}
            label="* Site"
            options={sitesDetail.map((siteDetail) => ({
              value: siteDetail.siteId, label: siteDetail.siteName,
            }))}
          />
          <Field
            name="acknowledge"
            component={RenderCheckbox}
            label="I acknowledge that the participant has accepted the offer in writing."
          />
        </Box>
        <Box mt={3}>
          <Grid container spacing={2} justify="flex-end">
            <Grid item>
              <Button
                onClick={onClose}
                color="default"
                text="Cancel"
              />
            </Grid>
            <Grid item>
              <Button
                onClick={submitForm}
                variant="contained"
                color="primary"
                text="Submit"
              />
            </Grid>
          </Grid>
        </Box>
      </FormikForm>
    )}
  </Formik>;
};
