import React from 'react';
import { Grid } from '@material-ui/core';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { FastField } from 'formik';
import { RenderRadioGroup } from '../../fields';
import { PleaseNoteBanner } from '../PleaseNoteBanner';

export const HCAPProgramSection = ({ checkFieldDisability }) => {
  return (
    <>
      <SectionHeader text='HCAP Program' />
      <PleaseNoteBanner text='Please submit a separate application for each program if you are interested in both.' />
      <Question text='1. * Which pathway are you applying for:' />
      <Grid item xs={12}>
        <FastField
          name='program'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('program')}
          setTouched
          row
          options={[
            { value: 'HCA', label: 'Health Care Assistant - HCAP' },
            { value: 'MHAW', label: 'Mental Health and Addictions Worker - HCAP' },
          ]}
        />
      </Grid>
    </>
  );
};
