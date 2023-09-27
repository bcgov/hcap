import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Collapse from '@material-ui/core/Collapse';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { FastField } from 'formik';
import { SpeakerNotesOutlined } from '@material-ui/icons';
import { Checkbox, FormControl, FormControlLabel } from '@material-ui/core';
import { isNil } from 'lodash';

import { Card, Divider } from '../generic';
import { RenderCheckbox, RenderCheckboxGroup, RenderTextField, RenderRadioGroup } from '../fields';
import {
  indigenousIdentities,
  indigenousIdentityLabels,
} from '../modal-forms/IndigenousDeclarationForm';
import {
  BC_LAWS_LINK,
  VANCOUVER_COASTAL_GOV_LINK,
  NORTHERN_GOV_LINK,
  FRASER_GOV_LINK,
  INTERIOR_GOV_LINK,
  VANCOUVER_ISLAND_GOV_LINK,
  HCAP_INFO_EMAIL,
  HEALTH_CARE_ASSISTANT_LINK,
  MENTAL_HEALTH_AND_ADDICTIONS_WORKER_LINK,
} from '../../constants';
import { SectionHeader } from './SectionHeader';
import { Question } from './Question';
import { PleaseNoteBanner } from './PleaseNoteBanner';

const useStyles = makeStyles((theme) => ({
  info: {
    color: 'rgb(13, 60, 97)',
    backgroundColor: 'rgb(232, 244, 253)',
    borderRadius: '4px',
    border: '1px solid rgb(175, 217, 252)',
  },
  infoHeader: {
    fontSize: '16px',
    marginBottom: theme.spacing(1),
    fontWeight: 'bold',
  },
  infoIcon: {
    color: 'rgb(21, 153, 222)',
    fontSize: '80px',
    marginRight: theme.spacing(2),
  },
  line: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderTop: '2px solid rgb(204, 204, 204)',
  },
}));

export const Fields = ({
  isDisabled,
  hideHelp,
  enableFields,
  isNonPortalHire,
  values,
  isSubmitted,
}) => {
  const classes = useStyles();
  const [isCollectionNoticeExpanded, setCollectionNoticeExpanded] = useState(
    window.innerWidth > 750
  );

  const checkFieldDisability = (key) =>
    isDisabled || (enableFields ? !enableFields.includes(key) : false);
  const hideReasonForFindingOut =
    !values?.reasonForFindingOut && checkFieldDisability('reasonForFindingOut');
  return (
    <>
      {!hideHelp && (
        <Box mb={2} py={1} px={2} display='flex' alignItems='center' className={classes.info}>
          <SpeakerNotesOutlined className={classes.infoIcon} />
          <Box py={1}>
            <Typography className={classes.infoHeader} component='h3'>
              Need Help?
            </Typography>
            <Typography variant='body2'>
              Contact a Health Career Access Program agent at{' '}
              <a rel='noreferrer' target='_blank' href={`mailto:${HCAP_INFO_EMAIL}`}>
                {HCAP_INFO_EMAIL}
              </a>
            </Typography>
            <Typography variant='body2'>
              Service is available from 8:00 am - 4:30 pm Pacific Time Monday through Friday,
              excluding statutory holidays.
            </Typography>
          </Box>
        </Box>
      )}
      <Box mb={4} mt={3}>
        <PleaseNoteBanner
          text='The following information is shared with employers for the purposes of
                recruitment.'
        />
      </Box>

      <Card noShadow={isDisabled}>
        {/** Indigenous Identity - meant to be READ-ONLY, not set up for editing */}
        <Grid container spacing={2}>
          {isSubmitted && !isNil(values.isIndigenous) && (
            <Grid item xs={12}>
              <Typography variant='subtitle2'>Indigenous Identity</Typography>
              <Divider />

              <Box display='flex' flexDirection='column'>
                <FormControl component='fieldset'>
                  <FormControl component='legend'>
                    <Typography variant='subtitle2'>
                      Do you identify as an Indigenous Person?
                    </Typography>
                  </FormControl>

                  <FastField
                    id='isIndigenous'
                    name='isIndigenous'
                    component={RenderRadioGroup}
                    disabled
                    row
                    options={[
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No' },
                    ]}
                  />
                </FormControl>

                {values.indigenousIdentities.length > 0 ? (
                  <FormControl component='fieldset'>
                    <FormControl component='legend'>
                      <Typography variant='subtitle2'>What is your Indigenous Identity?</Typography>
                      <Typography>Choose all that apply</Typography>
                    </FormControl>
                    {Object.keys(indigenousIdentities)
                      .map((key) => ({
                        label: indigenousIdentityLabels[key],
                        value: indigenousIdentities[key],
                      }))
                      .map((item) => (
                        <FormControlLabel
                          key={item.value}
                          disabled
                          label={item.label}
                          labelPlacement='end'
                          control={
                            <Checkbox
                              sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                              size='medium'
                              color='primary'
                              checked={values.indigenousIdentities?.includes(item.value)}
                            />
                          }
                        />
                      ))}
                  </FormControl>
                ) : null}
              </Box>
            </Grid>
          )}
          {/** Q1 HCAP Program applying for */}
          <SectionHeader text='HCAP Program' />
          <Question text='1. * Which program are you applying for:' />
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

          {/** Eligibility */}
          {isSubmitted && isNonPortalHire && isNil(values.eligibility) ? null : (
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
                    <Link
                      href={HEALTH_CARE_ASSISTANT_LINK}
                      target='__blank'
                      rel='noreferrer noopener'
                    >
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
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'unknown', label: `I don't know` },
                  ]}
                />
              </Grid>
            </>
          )}

          {/** Contact Info */}
          <SectionHeader text='Provide Your Contact Information' />
          <Grid item xs={12} sm={6}>
            <FastField
              name='firstName'
              component={RenderTextField}
              label='4. * First Name'
              disabled={checkFieldDisability('firstName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='lastName'
              component={RenderTextField}
              label='5. * Last Name'
              disabled={checkFieldDisability('lastName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='phoneNumber'
              type='tel'
              component={RenderTextField}
              label='6. * Phone Number'
              disabled={checkFieldDisability('phoneNumber')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='emailAddress'
              type='email'
              component={RenderTextField}
              label='7. * Email Address'
              disabled={checkFieldDisability('emailAddress')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='postalCode'
              component={RenderTextField}
              label='8. * Postal Code'
              disabled={checkFieldDisability('postalCode')}
            />
          </Grid>
          <PleaseNoteBanner
            text='The following information is collected as some employers may
              prioritize hiring of indigenous candidates or candidates with a drivers license in
              certain circumstances.'
          />

          {/** Q9 do you self identify as indigenous */}
          <Question text='9. Do you self-identify as First Nation, Métis, Inuk (Inuit) or Urban Indigenous?' />
          <Grid item xs={12}>
            <FastField
              name='indigenous'
              component={RenderRadioGroup}
              disabled={checkFieldDisability('indigenous')}
              setTouched
              row
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Prefer not to answer' },
              ]}
            />
          </Grid>
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
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Grid>
          {/** Q11 lived or experienced mental health or substance use challenges */}
          {/** only show if Q1 is Mental Health and Addictions Worker*/}
          {values.program === 'MHAW' && (
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
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'unknown', label: 'Prefer not to answer' },
                  ]}
                />
              </Grid>
            </>
          )}
          {/** Q12 Preferred Work Location */}
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
                      <Link
                        href={VANCOUVER_ISLAND_GOV_LINK}
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

          {!hideReasonForFindingOut && (
            <>
              {/** Q13 How did you learn about HCAP */}
              <SectionHeader text='Marketing' />
              <Question text='13. How did you learn about HCAP?' />
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
          )}
        </Grid>

        {/** Q14 Background information */}
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
            options={[
              {
                value: 'Accommodation and food services',
                label: 'Accommodation and food services',
              },
              {
                value: 'Administrative and support, waste management and remediation services ',
                label: 'Administrative and support, waste management and remediation services ',
              },
              {
                value: 'Agriculture, forestry, fishing, and hunting',
                label: 'Agriculture, forestry, fishing, and hunting',
              },
              {
                value: 'Arts, entertainment, and recreation',
                label: 'Arts, entertainment, and recreation',
              },
              {
                value: 'Community Social Services',
                label: 'Community Social Services',
              },
              {
                value: 'Construction',
                label: 'Construction',
              },
              {
                value: 'Continuing Care and Community Health Care',
                label: 'Continuing Care and Community Health Care',
              },
              {
                value: 'Educational services',
                label: 'Educational services',
              },
              {
                value: 'Finance and insurance',
                label: 'Finance and insurance',
              },
              {
                value: 'Health care and social assistance',
                label: 'Health care and social assistance',
              },
              {
                value: 'Information and cultural industries',
                label: 'Information and cultural industries',
              },
              {
                value: 'Management of companies and enterprises',
                label: 'Management of companies and enterprises',
              },
              {
                value: 'Manufacturing',
                label: 'Manufacturing',
              },
              {
                value: 'Mining, quarrying, and oil and gas extraction',
                label: 'Mining, quarrying, and oil and gas extraction',
              },
              {
                value: 'Professional, scientific, and technical services',
                label: 'Professional, scientific, and technical services',
              },
              {
                value: 'Public administration',
                label: 'Public administration',
              },
              {
                value: 'Real estate and rental and leasing',
                label: 'Real estate and rental and leasing',
              },
              {
                value: 'Retail trade',
                label: 'Retail trade',
              },
              {
                value: 'Transportation and warehousing',
                label: 'Transportation and warehousing',
              },
              {
                value: 'Tourism & Hospitality',
                label: 'Tourism & Hospitality',
              },
              {
                value: 'Utilities',
                label: 'Utilities',
              },
              {
                value: 'Wholesale trade',
                label: 'Wholesale trade',
              },
              {
                value: 'None, not working previously',
                label: 'None, not working previously',
              },
              {
                value: 'Other, please specify:',
                label: 'Other, please specify:',
              },
            ]}
          />
        </Grid>
        {values.currentOrMostRecentIndustry === 'Other, please specify:' && (
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
        {values.program === 'MHAW' &&
          (values.currentOrMostRecentIndustry === 'Health care and social assistance' ||
            values.currentOrMostRecentIndustry === 'Continuing Care and Community Health Care' ||
            values.currentOrMostRecentIndustry === 'Community Social Services') && (
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
                  options={[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                  ]}
                />
              </Grid>
            </>
          )}

        {/** Disclaimer and submission */}
        <Grid container spacing={2}>
          {isSubmitted && isNonPortalHire && isNil(values.consent) ? null : (
            <Grid item xs={12}>
              <hr className={classes.line} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FastField
                    name='consent'
                    disabled={checkFieldDisability('consent')}
                    component={RenderCheckbox}
                    label='I consent to have my personal information shared with the Health Career Access Program.'
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant='body1' gutterBottom>
              <b>Collection Notice</b>
            </Typography>
            <Typography variant='body2' paragraph>
              Personal information is collected via this form under&nbsp;
              <Link href={BC_LAWS_LINK} target='__blank' rel='noreferrer noopener'>
                sections 26(c) and (e) of the Freedom of Information and Protection of Privacy Act
              </Link>
              &nbsp;(FOIPPA) for the purposes of administering the Health Career Access Program.
            </Typography>
            <Collapse in={isCollectionNoticeExpanded || isDisabled}>
              <Typography variant='body2' paragraph>
                Personal information will only be used by authorized personnel to fulfill the
                purpose for which it was originally collected or for a use consistent with that
                purpose unless you expressly consent otherwise. We do not disclose your information
                to other public bodies or individuals except as authorized by FOIPPA.
              </Typography>
              <Typography variant='body2' paragraph>
                If you have any questions about our collection or use of personal information,
                please direct your inquiries to the Director, Planning, Integration and
                Partnerships, 1515 Blanshard Street, Victoria, British Columbia, V8W 3C8. Telephone:{' '}
                <Link href='tel:+12364783520'>236-478-3520</Link>, Email:{' '}
                <Link href={`mailto:${HCAP_INFO_EMAIL}`}>{HCAP_INFO_EMAIL}</Link>.
              </Typography>
            </Collapse>
            {!isDisabled && (
              <Box
                mt={0.25}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setCollectionNoticeExpanded((prevState) => !prevState)}
              >
                {!isCollectionNoticeExpanded ? 'Show More' : 'Show Less'}
              </Box>
            )}
          </Grid>
          {!isDisabled && (
            <Grid item xs={12}>
              <Typography variant='body1' gutterBottom>
                <b>Submit Your Form</b>
              </Typography>
              <Typography variant='body2' paragraph>
                Use the submit button to complete your expression of interest.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>
    </>
  );
};
