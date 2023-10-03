import React from 'react';
import { Grid } from '@material-ui/core';
import { FastField } from 'formik';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderRadioGroup, RenderTextField } from '../../fields';
import { YesNo, currentOrMostRecentIndustryOptions } from '../../../constants';
import { formatOptions } from '../../../utils';

export const BackgroundInformationSection = ({
  checkFieldDisability,
  isMHAWProgram,
  selectedOption,
}) => {
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
      {isMHAWProgram &&
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
