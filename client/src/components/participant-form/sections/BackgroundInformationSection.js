import React from 'react';
import { Grid } from '@material-ui/core';
import { FastField } from 'formik';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderRadioGroup, RenderTextField } from '../../fields';
import { YesNo } from '../../../constants';

export const BackgroundInformationSection = ({ checkFieldDisability, isMHAW, selectedOption }) => {
  return (
    <>
      <SectionHeader text='Background Information' />
      <Question
        text='14. What industry do you currently or most recently work in? Please select the most
              applicable option.'
      />
      <Grid item xs={12}>
        <FastField
          name='currentOrMostRecentIndustry'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('currentOrMostRecentIndustry')}
          setTouched
          options={[
            {
              value: 'Accommodation and food services',
              label: 'Accommodation and food services',
            },
            {
              value: 'Administrative and support, waste management and remediation services ',
              label: 'Administrative and support, waste management and remediation services ',
            },
            {
              value: 'Agriculture, forestry, fishing, and hunting',
              label: 'Agriculture, forestry, fishing, and hunting',
            },
            {
              value: 'Arts, entertainment, and recreation',
              label: 'Arts, entertainment, and recreation',
            },
            {
              value: 'Community Social Services',
              label: 'Community Social Services',
            },
            {
              value: 'Construction',
              label: 'Construction',
            },
            {
              value: 'Continuing Care and Community Health Care',
              label: 'Continuing Care and Community Health Care',
            },
            {
              value: 'Educational services',
              label: 'Educational services',
            },
            {
              value: 'Finance and insurance',
              label: 'Finance and insurance',
            },
            {
              value: 'Health care and social assistance',
              label: 'Health care and social assistance',
            },
            {
              value: 'Information and cultural industries',
              label: 'Information and cultural industries',
            },
            {
              value: 'Management of companies and enterprises',
              label: 'Management of companies and enterprises',
            },
            {
              value: 'Manufacturing',
              label: 'Manufacturing',
            },
            {
              value: 'Mining, quarrying, and oil and gas extraction',
              label: 'Mining, quarrying, and oil and gas extraction',
            },
            {
              value: 'Professional, scientific, and technical services',
              label: 'Professional, scientific, and technical services',
            },
            {
              value: 'Public administration',
              label: 'Public administration',
            },
            {
              value: 'Real estate and rental and leasing',
              label: 'Real estate and rental and leasing',
            },
            {
              value: 'Retail trade',
              label: 'Retail trade',
            },
            {
              value: 'Transportation and warehousing',
              label: 'Transportation and warehousing',
            },
            {
              value: 'Tourism & Hospitality',
              label: 'Tourism & Hospitality',
            },
            {
              value: 'Utilities',
              label: 'Utilities',
            },
            {
              value: 'Wholesale trade',
              label: 'Wholesale trade',
            },
            {
              value: 'None, not working previously',
              label: 'None, not working previously',
            },
            {
              value: 'Other, please specify:',
              label: 'Other, please specify:',
            },
          ]}
        />
      </Grid>
      {selectedOption === 'Other, please specify:' && (
        <Grid item xs={6}>
          <FastField
            name='otherIndustry'
            component={RenderTextField}
            disabled={checkFieldDisability('otherIndustry')}
          />
        </Grid>
      )}
      {/** Q15 does/ did this rolee involve delivering mental health/ substance use services */}
      {/** only show if Q1 is MHAW and Q14 is one of 3 below options */}
      {isMHAW === 'MHAW' &&
        (selectedOption === 'Health care and social assistance' ||
          selectedOption === 'Continuing Care and Community Health Care' ||
          selectedOption === 'Community Social Services') && (
          <>
            <Question
              text='15. Does/did this role involve delivering mental health and/or substance use
                    services?'
            />
            <Grid item xs={12}>
              <FastField
                name='roleInvolvesMentalHealthOrSubstanceUse'
                component={RenderRadioGroup}
                disabled={checkFieldDisability('roleInvolvesMentalHealthOrSubstanceUse')}
                setTouched
                row
                options={YesNo}
              />
            </Grid>
          </>
        )}
    </>
  );
};
