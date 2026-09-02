import React from 'react';
import { Grid } from '@mui/material';
import { FastField } from 'formik';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderRadioGroup } from '../../fields';
import { YesNo, YesNoPreferNot } from '../../../constants';
import { PleaseNoteBanner } from '../PleaseNoteBanner';

export const OtherSection = ({ checkFieldDisability }) => {
  return (
    <>
      <SectionHeader text='Other' />

      {/** Q09 do you have a valid BC drivers license */}
      <Question text='9. * Do you have a valid Class 5 BC Drivers Licence?' />
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
      {/** Q10 do you self identify as indigenous */}
      <PleaseNoteBanner
        text='The following information is collected as some employers may
              prioritize hiring of indigenous candidates and/or lived or living experience.'
      />
      <Question text='10. Do you self-identify as First Nation, Métis, Inuk (Inuit) or Urban Indigenous?' />
      <Grid item xs={12}>
        <FastField
          name='indigenous'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('indigenous')}
          setTouched
          row
          options={YesNoPreferNot}
        />
      </Grid>
    </>
  );
};
