import React from 'react';
import { Grid, Link } from '@material-ui/core';
import { FastField } from 'formik';
import {
  VANCOUVER_COASTAL_GOV_LINK,
  NORTHERN_GOV_LINK,
  FRASER_GOV_LINK,
  INTERIOR_GOV_LINK,
  VANCOUVER_ISLAND_GOV_LINK,
} from '../../../constants';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { RenderCheckboxGroup } from '../../fields';
import { PleaseNoteBanner } from '../PleaseNoteBanner';

export const PreferredWorkLocation = ({ checkFieldDisability }) => {
  return (
    <>
      <SectionHeader text='Select Your Preferred Work Location(s)' />
      <Question text='12. * Please select your preferred health region(s)' />
      <Grid item xs={12}>
        <FastField
          name='preferredLocation'
          component={RenderCheckboxGroup}
          disabled={checkFieldDisability('preferredLocation')}
          options={[
            {
              value: 'Interior',
              label: (
                <span>
                  Interior (
                  <Link href={INTERIOR_GOV_LINK} target='__blank' rel='noreferrer noopener'>
                    PDF map
                  </Link>
                  )
                </span>
              ),
            },
            {
              value: 'Fraser',
              label: (
                <span>
                  Fraser (
                  <Link href={FRASER_GOV_LINK} target='__blank' rel='noreferrer noopener'>
                    PDF map
                  </Link>
                  )
                </span>
              ),
            },
            {
              value: 'Vancouver Coastal',
              label: (
                <span>
                  Vancouver Coastal (
                  <Link
                    href={VANCOUVER_COASTAL_GOV_LINK}
                    target='__blank'
                    rel='noreferrer noopener'
                  >
                    PDF map
                  </Link>
                  )
                </span>
              ),
            },
            {
              value: 'Vancouver Island',
              label: (
                <span>
                  Vancouver Island (
                  <Link href={VANCOUVER_ISLAND_GOV_LINK} target='__blank' rel='noreferrer noopener'>
                    PDF map
                  </Link>
                  )
                </span>
              ),
            },
            {
              value: 'Northern',
              label: (
                <span>
                  Northern (
                  <Link href={NORTHERN_GOV_LINK} target='__blank' rel='noreferrer noopener'>
                    PDF map
                  </Link>
                  )
                </span>
              ),
            },
          ]}
        />
      </Grid>
      <PleaseNoteBanner
        text='The following information is not shared with potential employers.
                It is collected to evaluate and identify improvements to the Health Career Access
                Program as a whole.'
      />
    </>
  );
};
