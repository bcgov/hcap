import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { FastField } from 'formik';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderCheckboxGroup } from '../../fields';

export const MarketingSection = ({ checkFieldDisability }) => {
  return (
    <>
      {/** Q13 How did you learn about HCAP */}
      <SectionHeader text='Marketing' />
      <Question text='13. * How did you learn about HCAP?' />
      <Grid item xs={12}>
        <Typography>* Please select how you learned about HCAP</Typography>
      </Grid>
      <Grid item xs={12}>
        <FastField
          name='reasonForFindingOut'
          component={RenderCheckboxGroup}
          disabled={checkFieldDisability('reasonForFindingOut')}
          options={[
            {
              value: 'Friend(s) or family',
              label: 'Friend(s) or family',
            },
            {
              value: 'WorkBC',
              label: 'WorkBC',
            },
            {
              value: 'Government announcement',
              label: 'Government announcement',
            },
            {
              value: 'Colleague(s)',
              label: 'Colleague(s)',
            },
            {
              value: 'Job posting through Health Authority',
              label: 'Job posting through Health Authority',
            },
            {
              value: 'Job posting with employer',
              label: 'Job posting with employer',
            },
            {
              value: 'Web search',
              label: 'Web search',
            },
            {
              value: 'Social media',
              label: 'Social media',
            },
            {
              value: 'Other',
              label: 'Other',
            },
          ]}
        />
      </Grid>
    </>
  );
};
