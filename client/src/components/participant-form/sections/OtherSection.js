import React from 'react';
import { Grid } from '@material-ui/core';
import { FastField } from 'formik';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderRadioGroup } from '../../fields';
import { YesNo, YesNoPreferNot } from '../../../constants';
import { PleaseNoteBanner } from '../PleaseNoteBanner';

export const OtherSection = ({ checkFieldDisability, isMHAWProgram }) => {
  return (
    <>
      {/** Q10 do you have a valid BC drivers license */}
      <SectionHeader text='Other' />
      <Question text='10. * Do you have a valid BC Drivers Licence?' />
      <Grid item xs={12}>
        <FastField
          name='driverLicense'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('driverLicense')}
          setTouched
          row
          options={YesNo}
        />
      </Grid>
      {/** Q11 lived or experienced mental health or substance use challenges */}
      {/** only show if Q1 is Mental Health and Addictions Worker*/}
      {isMHAWProgram && (
        <>
          <PleaseNoteBanner
            text='The following information is collected as some employers may
            prioritize hiring of candidates with lived/living experience.'
          />
          <Question
            text='11. Do you have lived or living experience of mental health and/or substance use
                    challenges?'
          />
          <Grid item xs={12}>
            <FastField
              name='experienceWithMentalHealthOrSubstanceUse'
              component={RenderRadioGroup}
              disabled={checkFieldDisability('experienceWithMentalHealthOrSubstanceUse')}
              setTouched
              row
              options={YesNoPreferNot}
            />
          </Grid>
        </>
      )}
    </>
  );
};
