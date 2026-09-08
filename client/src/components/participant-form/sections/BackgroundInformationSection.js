import React, { useEffect } from 'react';
import { FastField, useField } from 'formik';
import Grid from '@mui/material/Grid';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderRadioGroup, RenderTextField } from '../../fields';
import { currentOrMostRecentIndustryOptions } from '../../../constants';
import { formatOptions, isOtherSelected } from '../../../utils';

export const BackgroundInformationSection = ({ checkFieldDisability, selectedOption }) => {
  const [industry, , industryHelpers] = useField('currentOrMostRecentIndustry');
  const [other, , otherHelpers] = useField('otherIndustry');

  useEffect(() => {
    if (
      !other.value &&
      industry.value &&
      !currentOrMostRecentIndustryOptions.includes(industry.value)
    ) {
      const otherValue = industry.value;
      industryHelpers.setValue('Other, please specify:');
      otherHelpers.setValue(otherValue);
    }
  }, [industry, other]);

  return (
    <>
      <SectionHeader text='Background Information' />
      <Question
        text='13. What industry do you currently or most recently work in? Please select the most
              applicable option.'
      />
      <Grid item xs={12}>
        <FastField
          name='currentOrMostRecentIndustry'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('currentOrMostRecentIndustry')}
          setTouched
          options={formatOptions(currentOrMostRecentIndustryOptions)}
          onChange={(e) => {
            const selectedValue = e.target.value;
            // reset the value of otherIndustry if user changes currentOrMostRecentIndustry selection
            if (selectedValue !== 'Other, please specify:') {
              otherHelpers.setValue('');
              otherHelpers.setTouched(false);
            }
          }}
        />
      </Grid>
      {isOtherSelected(selectedOption) && (
        <Grid item xs={6}>
          <FastField
            name='otherIndustry'
            component={RenderTextField}
            disabled={checkFieldDisability('otherIndustry')}
          />
        </Grid>
      )}
    </>
  );
};
