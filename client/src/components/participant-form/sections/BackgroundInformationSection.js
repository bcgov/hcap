import React, { useEffect } from 'react';
import { Grid } from '@material-ui/core';
import { FastField, useField } from 'formik';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderRadioGroup, RenderTextField } from '../../fields';
import { YesNo, currentOrMostRecentIndustryOptions } from '../../../constants';
import { formatOptions } from '../../../utils';
import { showRoleInvolvesMentalHealthOrSubstanceUse, isOtherSelected } from '../../../utils';

export const BackgroundInformationSection = ({
  checkFieldDisability,
  isMHAWProgram,
  selectedOption,
}) => {
  const [industry, , industryHelpers] = useField('currentOrMostRecentIndustry');
  const [other, , otherHelpers] = useField('otherIndustry');
  const [, , involvesMentalHealthHelpers] = useField('roleInvolvesMentalHealthOrSubstanceUse');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, other]);

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
          options={formatOptions(currentOrMostRecentIndustryOptions)}
          onChange={(e) => {
            const selectedValue = e.target.value;
            // reset the value of otherIndustry if user changes currentOrMostRecentIndustry selection
            if (selectedValue !== 'Other, please specify:') {
              otherHelpers.setValue('');
              otherHelpers.setTouched(false);
            }
            // reset the value of roleInvolvesMentalHealthOrSubstanceUse if user changes currentOrMostRecentIndustry selection
            // to a value that should not show the question
            if (!showRoleInvolvesMentalHealthOrSubstanceUse(isMHAWProgram, selectedValue)) {
              involvesMentalHealthHelpers.setValue('');
              involvesMentalHealthHelpers.setTouched(false);
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
      {/** Q15 does/ did this rolee involve delivering mental health/ substance use services */}
      {/** only show if Q1 is MHAW and Q14 is one of 3 below options */}
      {showRoleInvolvesMentalHealthOrSubstanceUse(isMHAWProgram, selectedOption) && (
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
