import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Box } from '@material-ui/core';
import { RenderDateField, RenderCheckbox, RenderTextField, RenderSelectField } from '../fields';
import { Field, Formik, Form as FormikForm } from 'formik';
import { getTodayDate } from '../../utils';
import store from 'store';

export const NewParticipantForm = ({ initialValues, validationSchema, onSubmit, onClose, sites }) => {

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
            name="HcapOpportunity"
            component={RenderCheckbox}
            label="HCAP Opportunity"
            checked
            disabled
          />
          <Field
            name="firstName"
            component={RenderTextField}
            label="* First Name"
          />
          <Field
            name="lastName"
            component={RenderTextField}
            label="* Last Name"
          />
          <Field
            name="phoneNumber"
            component={RenderTextField}
            label="* Phone Number"
            type="tel"
          />
          <Field
            name="emailAddress"
            component={RenderTextField}
            label="* Email Address"
            type="email"
          />
          <Field
            name="origin"
            component={RenderSelectField}
            label="* Origin of Offer"
            options={[{value: "internal", label: "Internal"}, {value: "other", label: "Other"}]}
          />
          { values.origin === "other" && <Field
            name="other-origin"
            component={RenderTextField}
            label="* Where did the offer originate?"
          />
          }
          <Field
            name="contactedDate"
            component={RenderDateField}
            maxDate={getTodayDate()}
            label="* Date Contacted"
          />
          <Field
            name="offerDate"
            component={RenderDateField}
            maxDate={getTodayDate()}
            label="* Date Offer Accepted"
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
