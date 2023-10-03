import React from 'react';
import { Grid, Link, Typography } from '@material-ui/core';
import { FastField } from 'formik';
import { RenderRadioGroup } from '../../fields';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import {
  HEALTH_CARE_ASSISTANT_LINK,
  MENTAL_HEALTH_AND_ADDICTIONS_WORKER_LINK,
  YesNoDontKnow,
} from '../../../constants';
import { PleaseNoteBanner } from '../PleaseNoteBanner';

export const EligibilitySection = ({ checkFieldDisability }) => {
  return (
    <>
      <SectionHeader text='Check Your Eligibility' />
      <PleaseNoteBanner
        text='For most positions in the health sector a criminal record
                check and full vaccination against COVID-19 is required.'
      />

      <Question text='2. * Are you a Canadian citizen or permanent resident?' />
      <Grid item xs={12}>
        <FastField
          name='eligibility'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('eligibility')}
          setTouched
          row
          options={[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ]}
        />
      </Grid>
      {/** Q3 English language competency requirements */}
      <Question text='3. * Do you meet the educational requirements for the program?' />
      <Grid item xs={12}>
        {' '}
        <Typography>
          <i>
            Please view{' '}
            <Link href={HEALTH_CARE_ASSISTANT_LINK} target='__blank' rel='noreferrer noopener'>
              Health Care Assistant
            </Link>{' '}
            or{' '}
            <Link
              href={MENTAL_HEALTH_AND_ADDICTIONS_WORKER_LINK}
              target='__blank'
              rel='noreferrer noopener'
            >
              Mental Health and Addictions Worker
            </Link>{' '}
            pages for more information.
          </i>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FastField
          name='educationalRequirements'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('educationalRequirements')}
          setTouched
          row
          options={YesNoDontKnow}
        />
      </Grid>
    </>
  );
};
