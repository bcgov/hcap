import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { FastField } from 'formik';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderCheckboxGroup } from '../../fields';
import { reasonForFindingOutOptions } from '../../../constants';
import { formatOptions } from '../../../utils';

export const MarketingSection = ({ checkFieldDisability }) => {
  return (
    <>
      {/** Q13 How did you learn about HCAP */}
      <SectionHeader text='Marketing' />
      <Question text='13. * How did you learn about HCAP?' />
      <Grid item xs={12}>
        <Typography>Please select all that apply</Typography>
      </Grid>
      <Grid item xs={12}>
        <FastField
          name='reasonForFindingOut'
          component={RenderCheckboxGroup}
          disabled={checkFieldDisability('reasonForFindingOut')}
          options={formatOptions(reasonForFindingOutOptions)}
        />
      </Grid>
    </>
  );
};
